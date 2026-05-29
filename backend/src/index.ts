import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { pool } from './db/index'

const app = new Hono()

// 1. Configure CORS for frontend and admin access
app.use('*', cors({
  origin: '*', // Customize this for production
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}))

// 2. Global Error / Health Handler
app.get('/api/health', async (c) => {
  try {
    // Basic connectivity check to MySQL remoteweb3Jobs
    const [rows] = await pool.query('SELECT 1 as alive')
    return c.json({
      status: 'ok',
      database: 'connected',
      runtime: 'bun ' + Bun.version,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return c.json({
      status: 'degraded',
      database: 'disconnected',
      error: error.message,
      runtime: 'bun ' + Bun.version,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// 3. API Routes for Jobs
app.get('/api/jobs', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '10', 10), 100)
    const offset = Math.max(parseInt(c.req.query('offset') || '0', 10), 0)
    
    const tag = c.req.query('tag')
    const isFeatured = c.req.query('is_featured')
    const keyword = c.req.query('keyword')
    const source = c.req.query('source')
    const isApproved = c.req.query('is_approved')
    
    const whereClauses: string[] = []
    const params: any[] = []
    
    if (tag) {
      whereClauses.push('tags LIKE ?')
      params.push(`%${tag}%`)
    }
    
    if (isFeatured !== undefined && isFeatured !== '') {
      whereClauses.push('is_featured = ?')
      params.push(isFeatured === 'true' || isFeatured === '1' ? 1 : 0)
    }
    
    if (source) {
      whereClauses.push('source = ?')
      params.push(source)
    }
    
    if (keyword) {
      whereClauses.push('(title LIKE ? OR company LIKE ? OR description LIKE ?)')
      const k = `%${keyword}%`
      params.push(k, k, k)
    }

    if (isApproved === 'all') {
      // Don't filter by approval status
    } else if (isApproved === 'false' || isApproved === '0') {
      whereClauses.push('is_approved = 0')
    } else if (isApproved === 'true' || isApproved === '1') {
      whereClauses.push('is_approved = 1')
    } else {
      // Default: only show approved jobs
      whereClauses.push('is_approved = 1')
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''
    
    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM jobs ${whereSql}`
    const [countRows]: any = await pool.query(countSql, params)
    const total = countRows[0]?.total || 0
    
    // Fetch paginated jobs (Sorted by sort_order DESC first, then is_featured DESC, then created_at DESC)
    const fetchSql = `SELECT * FROM jobs ${whereSql} ORDER BY sort_order DESC, is_featured DESC, created_at DESC LIMIT ? OFFSET ?`
    const [jobs]: any = await pool.query(fetchSql, [...params, limit, offset])
    
    return c.json({
      success: true,
      jobs,
      pagination: {
        total,
        limit,
        offset
      }
    })
  } catch (error: any) {
    console.error('Error fetching jobs:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.get('/api/jobs/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID format' }, 400)
    }
    
    const [rows]: any = await pool.query('SELECT * FROM jobs WHERE id = ?', [id])
    if (rows.length === 0) {
      return c.json({ success: false, error: 'Job not found' }, 404)
    }
    
    return c.json({
      success: true,
      job: rows[0]
    })
  } catch (error: any) {
    console.error(`Error getting job ${c.req.param('id')}:`, error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.post('/api/jobs', async (c) => {
  try {
    const body = await c.req.json()
    const { title, company, tags, salary, description, apply_url, is_featured, source, is_approved, sort_order } = body
    
    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return c.json({ success: false, error: 'Title is required' }, 400)
    }
    if (!company || typeof company !== 'string' || !company.trim()) {
      return c.json({ success: false, error: 'Company is required' }, 400)
    }
    
    let tagsStr = ''
    if (Array.isArray(tags)) {
      tagsStr = tags.map(t => t.trim()).filter(Boolean).join(',')
    } else if (typeof tags === 'string') {
      tagsStr = tags.split(',').map(t => t.trim()).filter(Boolean).join(',')
    }
    
    const isFeaturedVal = is_featured === true || is_featured === 1 || is_featured === 'true' || is_featured === '1' ? 1 : 0
    const sourceVal = source || 'manual'
    const isApprovedVal = is_approved !== undefined 
      ? (is_approved === true || is_approved === 1 || is_approved === 'true' || is_approved === '1' ? 1 : 0)
      : (sourceVal === 'crawler' ? 0 : 1)
    const sortOrderVal = parseInt(sort_order, 10) || 0
    
    // Duplicate verification check
    let checkSql = 'SELECT id FROM jobs WHERE (title = ? AND company = ?)'
    const checkParams = [title.trim(), company.trim()]
    if (apply_url && typeof apply_url === 'string' && apply_url.trim()) {
      checkSql += ' OR apply_url = ?'
      checkParams.push(apply_url.trim())
    }
    const [existing]: any = await pool.query(checkSql, checkParams)
    if (existing.length > 0) {
      return c.json({ success: false, error: 'Duplicate job listing found (same title and company, or same apply URL)' }, 409)
    }

    const [result]: any = await pool.query(
      `INSERT INTO jobs (title, company, tags, salary, description, apply_url, is_featured, source, is_approved, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), company.trim(), tagsStr, salary || null, description || null, apply_url || null, isFeaturedVal, sourceVal, isApprovedVal, sortOrderVal]
    )
    
    const insertId = result.insertId

    // Sync tags automatically
    if (tagsStr) {
      try {
        const tagArray = tagsStr.split(',').map(t => t.trim()).filter(Boolean)
        for (const t of tagArray) {
          // Use INSERT IGNORE to gracefully handle duplicates
          await pool.query('INSERT IGNORE INTO tags (name) VALUES (?)', [t])
        }
      } catch (err) {
        console.error('Error auto-syncing tags:', err)
      }
    }
    
    return c.json({
      success: true,
      message: 'Job listing submitted successfully',
      data: {
        id: insertId,
        title: title.trim(),
        company: company.trim(),
        tags: tagsStr,
        salary: salary || null,
        description: description || null,
        apply_url: apply_url || null,
        is_featured: isFeaturedVal === 1,
        source: sourceVal,
        is_approved: isApprovedVal === 1,
        sort_order: sortOrderVal
      }
    }, 201)
  } catch (error: any) {
    console.error('Error creating job:', error)
    return c.json({ success: false, error: error.message }, 400)
  }
})

app.put('/api/jobs/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID format' }, 400)
    }
    
    // Check if the job exists first
    const [checkRows]: any = await pool.query('SELECT id FROM jobs WHERE id = ?', [id])
    if (checkRows.length === 0) {
      return c.json({ success: false, error: 'Job not found' }, 404)
    }
    
    const body = await c.req.json()
    const { title, company, tags, salary, description, apply_url, is_featured, source, is_approved, sort_order } = body
    
    const updates: string[] = []
    const params: any[] = []
    
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return c.json({ success: false, error: 'Title cannot be empty' }, 400)
      }
      updates.push('title = ?')
      params.push(title.trim())
    }
    
    if (company !== undefined) {
      if (!company || typeof company !== 'string' || !company.trim()) {
        return c.json({ success: false, error: 'Company cannot be empty' }, 400)
      }
      updates.push('company = ?')
      params.push(company.trim())
    }
    
    if (tags !== undefined) {
      let tagsStr = ''
      if (Array.isArray(tags)) {
        tagsStr = tags.map(t => t.trim()).filter(Boolean).join(',')
      } else if (typeof tags === 'string') {
        tagsStr = tags.split(',').map(t => t.trim()).filter(Boolean).join(',')
      }
      updates.push('tags = ?')
      params.push(tagsStr)
    }
    
    if (salary !== undefined) {
      updates.push('salary = ?')
      params.push(salary)
    }
    
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    
    if (apply_url !== undefined) {
      updates.push('apply_url = ?')
      params.push(apply_url)
    }
    
    if (is_featured !== undefined) {
      updates.push('is_featured = ?')
      params.push(is_featured === true || is_featured === 1 || is_featured === 'true' || is_featured === '1' ? 1 : 0)
    }
    
    if (source !== undefined) {
      updates.push('source = ?')
      params.push(source)
    }

    if (is_approved !== undefined) {
      updates.push('is_approved = ?')
      params.push(is_approved === true || is_approved === 1 || is_approved === 'true' || is_approved === '1' ? 1 : 0)
    }

    if (sort_order !== undefined) {
      updates.push('sort_order = ?')
      params.push(parseInt(sort_order, 10) || 0)
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400)
    }
    
    const updateSql = `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`
    await pool.query(updateSql, [...params, id])
    
    // Return updated job
    const [rows]: any = await pool.query('SELECT * FROM jobs WHERE id = ?', [id])
    
    return c.json({
      success: true,
      message: 'Job listing updated successfully',
      job: rows[0]
    })
  } catch (error: any) {
    console.error(`Error updating job ${c.req.param('id')}:`, error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Batch approval API
app.post('/api/jobs/batch-approve', async (c) => {
  try {
    const body = await c.req.json()
    const { ids, is_approved } = body
    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, error: 'ids must be a non-empty array' }, 400)
    }
    
    const isApprovedVal = is_approved === true || is_approved === 1 || is_approved === 'true' || is_approved === '1' ? 1 : 0
    
    // Use IN clause to update all selected ids
    const placeholders = ids.map(() => '?').join(',')
    const querySql = `UPDATE jobs SET is_approved = ? WHERE id IN (${placeholders})`
    await pool.query(querySql, [isApprovedVal, ...ids])
    
    return c.json({
      success: true,
      message: `Successfully updated approval status to ${isApprovedVal === 1} for ${ids.length} jobs.`
    })
  } catch (error: any) {
    console.error('Error in batch-approve:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.delete('/api/jobs/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID format' }, 400)
    }
    
    const [checkRows]: any = await pool.query('SELECT id FROM jobs WHERE id = ?', [id])
    if (checkRows.length === 0) {
      return c.json({ success: false, error: 'Job not found' }, 404)
    }
    
    await pool.query('DELETE FROM jobs WHERE id = ?', [id])
    
    return c.json({
      success: true,
      message: 'Job listing deleted successfully'
    })
  } catch (error: any) {
    console.error(`Error deleting job ${c.req.param('id')}:`, error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 4. API Routes for Crawler Logs / Records
app.post('/api/crawl-records', async (c) => {
  try {
    const body = await c.req.json()
    const { url, status, extracted_count, error_message } = body
    
    if (!url || !status) {
      return c.json({ success: false, error: 'url and status are required' }, 400)
    }
    
    const [result]: any = await pool.query(
      `INSERT INTO crawl_records (url, status, extracted_count, error_message) VALUES (?, ?, ?, ?)`,
      [url, status, extracted_count || 0, error_message || null]
    )
    
    return c.json({
      success: true,
      message: 'Crawl record added successfully',
      data: {
        id: result.insertId,
        url,
        status,
        extracted_count: extracted_count || 0,
        error_message: error_message || null
      }
    }, 201)
  } catch (error: any) {
    console.error('Error logging crawl record:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.put('/api/crawl-records/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID format' }, 400)
    }
    
    // Check if the record exists
    const [checkRows]: any = await pool.query('SELECT id FROM crawl_records WHERE id = ?', [id])
    if (checkRows.length === 0) {
      return c.json({ success: false, error: 'Record not found' }, 404)
    }
    
    const body = await c.req.json()
    const { status, extracted_count, error_message } = body
    
    const updates: string[] = []
    const params: any[] = []
    
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (extracted_count !== undefined) {
      updates.push('extracted_count = ?')
      params.push(parseInt(extracted_count, 10) || 0)
    }
    if (error_message !== undefined) {
      updates.push('error_message = ?')
      params.push(error_message || null)
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400)
    }
    
    const updateSql = `UPDATE crawl_records SET ${updates.join(', ')} WHERE id = ?`
    await pool.query(updateSql, [...params, id])
    
    return c.json({
      success: true,
      message: 'Crawl record updated successfully'
    })
  } catch (error: any) {
    console.error(`Error updating crawl record ${c.req.param('id')}:`, error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.get('/api/crawl-records', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 100)
    const offset = Math.max(parseInt(c.req.query('offset') || '0', 10), 0)
    
    const [records]: any = await pool.query(
      `SELECT * FROM crawl_records ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    )
    
    const [countRows]: any = await pool.query('SELECT COUNT(*) as total FROM crawl_records')
    const total = countRows[0]?.total || 0
    
    return c.json({
      success: true,
      records,
      pagination: {
        total,
        limit,
        offset
      }
    })
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// 5. API Routes for Tags
app.get('/api/tags', async (c) => {
  try {
    const isEnabled = c.req.query('is_enabled')
    let sql = 'SELECT * FROM tags'
    const params: any[] = []
    
    if (isEnabled === 'true' || isEnabled === '1') {
      sql += ' WHERE is_enabled = 1'
    } else if (isEnabled === 'false' || isEnabled === '0') {
      sql += ' WHERE is_enabled = 0'
    }
    sql += ' ORDER BY created_at DESC'
    
    const [tags]: any = await pool.query(sql, params)
    return c.json({ success: true, tags })
  } catch (error: any) {
    console.error('Error fetching tags:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.post('/api/tags', async (c) => {
  try {
    const { name } = await c.req.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return c.json({ success: false, error: 'Tag name is required' }, 400)
    }
    
    const tagName = name.trim()
    const [existing]: any = await pool.query('SELECT id FROM tags WHERE name = ?', [tagName])
    if (existing.length > 0) {
      return c.json({ success: false, error: 'Tag already exists' }, 409)
    }
    
    const [result]: any = await pool.query('INSERT INTO tags (name) VALUES (?)', [tagName])
    return c.json({ success: true, data: { id: result.insertId, name: tagName, is_enabled: 1 } }, 201)
  } catch (error: any) {
    console.error('Error creating tag:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.put('/api/tags/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    const { name, is_enabled } = await c.req.json()
    
    const updates: string[] = []
    const params: any[] = []
    
    if (name && name.trim()) {
      // Check duplicate
      const tagName = name.trim()
      const [existing]: any = await pool.query('SELECT id FROM tags WHERE name = ? AND id != ?', [tagName, id])
      if (existing.length > 0) {
        return c.json({ success: false, error: 'Tag name already exists' }, 409)
      }
      updates.push('name = ?')
      params.push(tagName)
    }
    
    if (is_enabled !== undefined) {
      updates.push('is_enabled = ?')
      params.push(is_enabled ? 1 : 0)
    }
    
    if (updates.length > 0) {
      await pool.query(`UPDATE tags SET ${updates.join(', ')} WHERE id = ?`, [...params, id])
    }
    
    return c.json({ success: true, message: 'Tag updated successfully' })
  } catch (error: any) {
    console.error('Error updating tag:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.delete('/api/tags/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    await pool.query('DELETE FROM tags WHERE id = ?', [id])
    return c.json({ success: true, message: 'Tag deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting tag:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

app.post('/api/tags/sync', async (c) => {
  try {
    const { names } = await c.req.json()
    if (!Array.isArray(names)) {
      return c.json({ success: false, error: 'names must be an array of strings' }, 400)
    }
    
    let synced = 0
    for (const name of names) {
      if (typeof name === 'string' && name.trim()) {
        try {
          await pool.query('INSERT IGNORE INTO tags (name) VALUES (?)', [name.trim()])
          synced++
        } catch (err) {}
      }
    }
    
    return c.json({ success: true, message: `Synced ${synced} tags` })
  } catch (error: any) {
    console.error('Error syncing tags:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Start Server
const port = parseInt(process.env.PORT || '6002', 10)
console.log(`⚡ Hono running on Bun at http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}

