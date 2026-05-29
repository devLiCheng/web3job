import * as cheerio from 'cheerio'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

export interface CrawlRecord {
  timestamp: string
  url: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  extractedCount: number
  error?: string
}

// In-memory logger tracking crawl history
const logs: CrawlRecord[] = []

export function getCrawlLogs() {
  return logs
}

/**
 * Core crawler logic.
 * Fetches HTML from a listing, processes text, and invokes Vercel AI SDK (DeepSeek V4 Pro)
 * to output highly accurate, standardized JSON schemas.
 */
export async function runCrawler(url: string, limit: number = 5): Promise<any> {
  const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:6002/api'
  
  const record: CrawlRecord = {
    timestamp: new Date().toISOString(),
    url,
    status: 'PENDING',
    extractedCount: 0
  }
  logs.unshift(record)

  let recordId: number | null = null

  // 1. Log PENDING state to MySQL backend
  try {
    const postRes = await fetch(`${backendApiUrl}/crawl-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        status: 'PENDING',
        extracted_count: 0
      })
    })
    if (postRes.ok) {
      const data = await postRes.json()
      if (data.success && data.data?.id) {
        recordId = data.data.id
      }
    }
  } catch (logErr) {
    console.error(`[Crawler] Failed to log PENDING state to MySQL backend:`, logErr)
  }

  try {
    console.log(`[Crawler] Fetching page content: ${url}`)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP fetch failed with status ${response.status}`)
    }

    const html = await response.text()
    
    // Parse HTML with Cheerio to isolate important page text (stripping scripts, styles, etc.)
    const $ = cheerio.load(html)
    $('script, style, iframe, nav, footer').remove()
    
    // Extract main text content
    const pageText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000) // limit size to optimize context
    
    console.log(`[Crawler] Isolating main body text (${pageText.length} chars). Sending to DeepSeek V4 Pro...`)

    // Configure the AI model targeting DeepSeek V4 Pro endpoint
    // It uses the OpenAI compatible layer in the AI SDK
    const deepseek = createOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY || 'mock-key',
      baseURL: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1'
    })

    const deepseekProvider = deepseek('deepseek-chat')

    // Invoke Vercel AI SDK generateText for custom OpenAI-compatible JSON output
    const { text } = await generateText({
      model: deepseekProvider,
      prompt: `Analyze the following raw scraped text from a remote web3 job site. Extract up to ${limit} unique remote web3 job listings exactly as a structured JSON array.
      
      You must respond ONLY with a valid JSON array matching the following structure:
      [
        {
          "title": "The official remote job position title (string)",
          "company": "Name of the company/dao offering the job (string)",
          "tags": ["Solidity", "Rust", "React", "Smart Contracts", etc. (array of strings)],
          "salary": "Salary or token compensation range if listed. Empty string if none specified. (string)",
          "description": "Briefly clean and summarize the job description and requirements in Markdown format (string)",
          "apply_url": "Direct URL to apply for the job (string)"
        },
        ...
      ]

      Raw Scraped Text:
      """
      ${pageText}
      """
      `
    })

    console.log(`[Crawler] AI extraction successful! Raw text length: ${text.length}`)

    // Clean markdown code blocks from response if present
    const cleanText = text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim()
    const rawJobs = JSON.parse(cleanText)
    const jobsList = Array.isArray(rawJobs) ? rawJobs : [rawJobs]

    let sourceName = 'crawler'
    try {
      const parsedUrl = new URL(url)
      sourceName = parsedUrl.hostname.replace('www.', '')
    } catch (e) {
      sourceName = 'crawler'
    }

    console.log(`[Crawler] AI parsed ${jobsList.length} items from raw text. Processing database submission (source: ${sourceName})...`)

    let insertedCount = 0

    for (const job of jobsList) {
      if (!job || !job.title || !job.company) continue

      // Standardize tags: array to clean comma-separated string
      const standardizedTags = Array.isArray(job.tags)
        ? job.tags.map((t: string) => t.trim()).filter(Boolean).join(',')
        : ''

      // Submit extracted result to our main Backend Hono API (port 6002)
      const pushResponse = await fetch(`${backendApiUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...job,
          tags: standardizedTags,
          is_featured: true,
          source: sourceName,
          is_approved: false
        })
      })

      if (pushResponse.ok) {
        insertedCount++
        console.log(`[Crawler] Inserted new job: "${job.title}" at "${job.company}"`)
      } else if (pushResponse.status === 409) {
        console.log(`[Crawler] Skipped duplicate job: "${job.title}" at "${job.company}"`)
      } else {
        console.warn(`[Crawler] Failed to push job to backend:`, await pushResponse.text())
      }
    }

    console.log(`[Crawler] Processing done! Successfully inserted ${insertedCount} new listings.`)

    // Extract all unique tags and sync them in bulk
    try {
      const allTags = new Set<string>()
      jobsList.forEach(job => {
        if (Array.isArray(job.tags)) {
          job.tags.forEach((t: any) => { if (typeof t === 'string' && t.trim()) allTags.add(t.trim()) })
        } else if (typeof job.tags === 'string') {
          job.tags.split(',').forEach((t: string) => { if (t.trim()) allTags.add(t.trim()) })
        }
      })
      if (allTags.size > 0) {
        await fetch(`${backendApiUrl}/tags/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names: Array.from(allTags) })
        })
        console.log(`[Crawler] Bulk synced ${allTags.size} tags successfully.`)
      }
    } catch (syncErr) {
      console.error(`[Crawler] Failed to bulk sync tags:`, syncErr)
    }

    // Mark log record as completed in-memory
    record.status = 'SUCCESS'
    record.extractedCount = insertedCount

    // 2. Log SUCCESS state to MySQL backend
    try {
      if (recordId) {
        await fetch(`${backendApiUrl}/crawl-records/${recordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'SUCCESS',
            extracted_count: insertedCount
          })
        })
      } else {
        await fetch(`${backendApiUrl}/crawl-records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url,
            status: 'SUCCESS',
            extracted_count: insertedCount
          })
        })
      }
    } catch (logErr) {
      console.error(`[Crawler] Failed to log SUCCESS state to MySQL backend:`, logErr)
    }

    return jobsList

  } catch (error: any) {
    console.error(`[Crawler] Error running scrape job:`, error)
    record.status = 'FAILED'
    record.error = error.message

    // 3. Log FAILED state to MySQL backend
    try {
      if (recordId) {
        await fetch(`${backendApiUrl}/crawl-records/${recordId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'FAILED',
            extracted_count: 0,
            error_message: error.message
          })
        })
      } else {
        await fetch(`${backendApiUrl}/crawl-records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url,
            status: 'FAILED',
            extracted_count: 0,
            error_message: error.message
          })
        })
      }
    } catch (logErr) {
      console.error(`[Crawler] Failed to log FAILED state to MySQL backend:`, logErr)
    }

    throw error
  }
}
