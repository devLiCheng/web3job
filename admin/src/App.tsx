import React, { useState, useEffect, useMemo } from 'react'
import { Layout, Menu, Breadcrumb, Grid, Card, Table, Tag, Button, Typography, Space, Input, Message, Modal, Form, InputNumber, Switch, Select, Descriptions } from '@arco-design/web-react'
import { IconDashboard, IconList, IconSettings, IconUser, IconCheckCircle, IconPlayArrow, IconRefresh, IconEdit, IconInfoCircle, IconDelete, IconTag } from '@arco-design/web-react/icon'

const { Header, Footer, Sider, Content } = Layout
const MenuItem = Menu.Item
const { Title, Paragraph } = Typography
const FormItem = Form.Item

// Database mapped models
interface JobRow {
  key: string
  id: number
  title: string
  company: string
  tags: string
  salary: string
  description: string
  apply_url: string
  is_featured: boolean | number
  source: string
  is_approved: boolean | number
  sort_order: number
  created_at: string
  updated_at: string
}

interface CrawlRecord {
  id: number
  url: string
  status: string
  extracted_count: number
  error_message: string | null
  created_at: string
}

interface TagRow {
  key: string
  id: number
  name: string
  is_enabled: boolean | number
  created_at: string
  updated_at: string
}

// User management models
interface MockUser {
  username: string
  email: string
  status: 'Active' | 'Disabled'
  registeredAt: string
}

interface CaptchaLog {
  email: string
  code: string
  status: string
  time: string
}

const DEFAULT_MOCK_USERS: MockUser[] = [
  { username: 'alice_web3', email: 'alice@example.com', status: 'Active', registeredAt: '2026-05-01T10:00:00Z' },
  { username: 'bob_defi', email: 'bob@defiprotocol.io', status: 'Active', registeredAt: '2026-05-10T14:30:00Z' },
  { username: 'charlie_nft', email: 'charlie@nftworld.xyz', status: 'Disabled', registeredAt: '2026-05-15T09:15:00Z' },
  { username: 'diana_dao', email: 'diana@daogov.org', status: 'Active', registeredAt: '2026-05-20T16:45:00Z' },
]

export default function App() {
  const [selectedKey, setSelectedKey] = useState<string>('dashboard')
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false)
  const [crawlRecords, setCrawlRecords] = useState<CrawlRecord[]>([])
  const [loadingCrawl, setLoadingCrawl] = useState<boolean>(false)
  const [scraperUrl, setScraperUrl] = useState<string>('https://example.com/web3-solidity-developer-job')
  const [scraperLimit, setScraperLimit] = useState<number>(5)
  const [isScraping, setIsScraping] = useState<boolean>(false)
  const [totalJobsCount, setTotalJobsCount] = useState<number>(0)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  // States for Edit Modal
  const [isEditVisible, setIsEditVisible] = useState<boolean>(false)
  const [editingJob, setEditingJob] = useState<JobRow | null>(null)
  const [editForm] = Form.useForm()

  // States for Search & Filters
  const [filterKeyword, setFilterKeyword] = useState<string>('')
  const [filterSortOrder, setFilterSortOrder] = useState<number | undefined>(undefined)
  const [filterApproved, setFilterApproved] = useState<string>('all')

  // User Manager states
  const [mockUsers, setMockUsers] = useState<MockUser[]>([])
  const [captchaLogs, setCaptchaLogs] = useState<CaptchaLog[]>([])
  const [filterSource, setFilterSource] = useState<string>('all')

  const uniqueSources = useMemo(() => {
    const sources = jobs.map(j => j.source || 'manual')
    return Array.from(new Set(sources))
  }, [jobs])

  const displayedJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filterKeyword.trim()) {
        const kw = filterKeyword.toLowerCase()
        const matches = 
          (job.title || '').toLowerCase().includes(kw) ||
          (job.company || '').toLowerCase().includes(kw) ||
          (job.description || '').toLowerCase().includes(kw) ||
          (job.tags || '').toLowerCase().includes(kw)
        if (!matches) return false
      }
      if (filterSortOrder !== undefined && filterSortOrder !== null) {
        if ((job.sort_order || 0) < filterSortOrder) return false
      }
      if (filterApproved !== 'all') {
        const isApp = filterApproved === 'approved'
        const jobApp = job.is_approved === 1 || job.is_approved === true
        if (jobApp !== isApp) return false
      }
      if (filterSource !== 'all') {
        const src = job.source || 'manual'
        if (src !== filterSource) return false
      }
      return true
    })
  }, [jobs, filterKeyword, filterSortOrder, filterSource, filterApproved])

  // Tags Management states
  const [tagsData, setTagsData] = useState<TagRow[]>([])
  const [loadingTags, setLoadingTags] = useState<boolean>(false)
  const [isTagModalVisible, setIsTagModalVisible] = useState<boolean>(false)
  const [editingTag, setEditingTag] = useState<TagRow | null>(null)
  const [tagForm] = Form.useForm()

  const fetchTags = async () => {
    setLoadingTags(true)
    try {
      const response = await fetch('http://localhost:6002/api/tags')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const mapped = (data.tags || []).map((t: any) => ({ ...t, key: String(t.id) }))
          setTagsData(mapped)
        } else {
          Message.error(data.error || 'Failed to fetch tags')
        }
      } else {
        Message.error('HTTP error fetching tags')
      }
    } catch (error: any) {
      console.error('Error fetching tags:', error)
      Message.error(`Network error: ${error.message}`)
    } finally {
      setLoadingTags(false)
    }
  }

  // States for Detail Modal
  const [isDetailVisible, setIsDetailVisible] = useState<boolean>(false)
  const [detailedJob, setDetailedJob] = useState<JobRow | null>(null)

  // Fetch functions
  const fetchJobs = async () => {
    setLoadingJobs(true)
    try {
      const response = await fetch('http://localhost:6002/api/jobs?limit=100&is_approved=all')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const mapped = (data.jobs || []).map((job: any) => ({
            ...job,
            key: String(job.id)
          }))
          setJobs(mapped)
          setTotalJobsCount(data.pagination?.total || mapped.length)
        } else {
          Message.error(data.error || 'Failed to fetch jobs')
        }
      } else {
        Message.error('HTTP error fetching jobs')
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      Message.error(`Network error: ${error.message}`)
    } finally {
      setLoadingJobs(false)
    }
  }

  const fetchCrawlRecords = async () => {
    setLoadingCrawl(true)
    try {
      const response = await fetch('http://localhost:6002/api/crawl-records?limit=50')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCrawlRecords(data.records || [])
        } else {
          Message.error(data.error || 'Failed to fetch crawl records')
        }
      } else {
        Message.error('HTTP error fetching crawl records')
      }
    } catch (error: any) {
      console.error('Error fetching crawl records:', error)
      Message.error(`Network error: ${error.message}`)
    } finally {
      setLoadingCrawl(false)
    }
  }

  // Deletion logic
  const handleDeleteJob = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:6002/api/jobs/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        Message.success('Job listing deleted successfully from database.')
        // Refresh both jobs and crawl records
        fetchJobs()
        fetchCrawlRecords()
      } else {
        Message.error(`Failed to delete job: ${data.error}`)
      }
    } catch (error: any) {
      Message.error(`Error deleting job: ${error.message}`)
    }
  }

  // Modal actions
  const showEditModal = (job: JobRow) => {
    setEditingJob(job)
    editForm.setFieldsValue({
      title: job.title,
      company: job.company,
      tags: job.tags,
      salary: job.salary,
      description: job.description,
      apply_url: job.apply_url,
      is_featured: job.is_featured === 1 || job.is_featured === true,
      source: job.source,
      is_approved: job.is_approved === 1 || job.is_approved === true,
      sort_order: job.sort_order || 0
    })
    setIsEditVisible(true)
  }

  const handleEditSubmit = async () => {
    if (!editingJob) return
    try {
      const values = await editForm.validateFields()
      const response = await fetch(`http://localhost:6002/api/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          is_featured: values.is_featured ? 1 : 0,
          is_approved: values.is_approved ? 1 : 0,
          sort_order: parseInt(values.sort_order, 10) || 0
        })
      })
      const data = await response.json()
      if (data.success) {
        Message.success('Job listing updated successfully.')
        setIsEditVisible(false)
        setEditingJob(null)
        fetchJobs()
      } else {
        Message.error(`Failed to update job: ${data.error}`)
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  const showDetailModal = (job: JobRow) => {
    setDetailedJob(job)
    setIsDetailVisible(true)
  }

  // Approval toggle logic
  const handleToggleApprove = async (id: number, approved: boolean) => {
    try {
      const response = await fetch(`http://localhost:6002/api/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_approved: approved })
      })
      const data = await response.json()
      if (data.success) {
        Message.success(approved ? 'Job listing approved!' : 'Job listing disabled.')
        fetchJobs()
      } else {
        Message.error(`Failed to update status: ${data.error}`)
      }
    } catch (error: any) {
      Message.error(`Error updating job: ${error.message}`)
    }
  }

  // Batch approval logic
  const handleBatchApprove = async (approved: boolean) => {
    if (selectedRowKeys.length === 0) {
      Message.warning('Please select jobs first.')
      return
    }
    try {
      const response = await fetch(`http://localhost:6002/api/jobs/batch-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: selectedRowKeys.map(k => Number(k)),
          is_approved: approved
        })
      })
      const data = await response.json()
      if (data.success) {
        Message.success(`Successfully updated status for ${selectedRowKeys.length} jobs.`)
        setSelectedRowKeys([])
        fetchJobs()
      } else {
        Message.error(`Batch update failed: ${data.error}`)
      }
    } catch (error: any) {
      Message.error(`Error in batch approval: ${error.message}`)
    }
  }

  // Scraper launch logic
  const handleTriggerScraper = async () => {
    if (!scraperUrl.trim()) {
      Message.warning('Please enter a target URL.')
      return
    }
    setIsScraping(true)
    try {
      const response = await fetch('http://localhost:6004/api/spider/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: scraperUrl, limit: scraperLimit })
      })
      const data = await response.json()
      if (data.success) {
        Message.success('AI Crawler initiated in background!')
        // Poll for records updates
        setTimeout(() => {
          fetchCrawlRecords()
          fetchJobs()
        }, 1500)
      } else {
        Message.error(`Scraper error: ${data.error}`)
      }
    } catch (error: any) {
      Message.error(`Failed to initiate scraper: ${error.message}`)
    } finally {
      setIsScraping(false)
    }
  }

  // User management helpers
  const loadMockUsers = () => {
    try {
      const raw = localStorage.getItem('mock_registered_users')
      if (raw) {
        const parsed: MockUser[] = JSON.parse(raw)
        setMockUsers(parsed)
      } else {
        setMockUsers(DEFAULT_MOCK_USERS)
        localStorage.setItem('mock_registered_users', JSON.stringify(DEFAULT_MOCK_USERS))
      }
    } catch {
      setMockUsers(DEFAULT_MOCK_USERS)
      localStorage.setItem('mock_registered_users', JSON.stringify(DEFAULT_MOCK_USERS))
    }
  }

  const loadCaptchaLogs = () => {
    try {
      const raw = localStorage.getItem('mock_captcha_logs')
      if (raw) {
        setCaptchaLogs(JSON.parse(raw))
      } else {
        setCaptchaLogs([])
      }
    } catch {
      setCaptchaLogs([])
    }
  }

  const handleToggleUserStatus = (index: number) => {
    const updated = [...mockUsers]
    updated[index] = {
      ...updated[index],
      status: updated[index].status === 'Active' ? 'Disabled' : 'Active'
    }
    setMockUsers(updated)
    localStorage.setItem('mock_registered_users', JSON.stringify(updated))
    Message.success(`User "${updated[index].username}" status changed to ${updated[index].status}.`)
  }

  const handleDeleteUser = (index: number) => {
    const user = mockUsers[index]
    Modal.confirm({
      title: `Delete User / 删除用户`,
      content: `Are you sure you want to delete "${user.username}"? This cannot be undone.`,
      onOk: () => {
        const updated = mockUsers.filter((_, i) => i !== index)
        setMockUsers(updated)
        localStorage.setItem('mock_registered_users', JSON.stringify(updated))
        Message.success(`User "${user.username}" deleted successfully.`)
      }
    })
  }

  const handleClearCaptchaLogs = () => {
    Modal.confirm({
      title: 'Clear All Captcha Logs / 清除所有验证码日志',
      content: 'Are you sure you want to clear all verification code audit logs?',
      onOk: () => {
        setCaptchaLogs([])
        localStorage.setItem('mock_captcha_logs', JSON.stringify([]))
        Message.success('Captcha logs cleared successfully.')
      }
    })
  }

  const handleCreateOrUpdateTag = async (values: any) => {
    try {
      const isEditing = !!editingTag
      const url = isEditing ? `http://localhost:6002/api/tags/${editingTag.id}` : 'http://localhost:6002/api/tags'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await response.json()
      if (data.success) {
        Message.success(data.message || (isEditing ? 'Tag updated' : 'Tag created'))
        setIsTagModalVisible(false)
        fetchTags()
      } else {
        Message.error(data.error || 'Operation failed')
      }
    } catch (err: any) {
      Message.error(`Error: ${err.message}`)
    }
  }

  const handleDeleteTag = (id: number) => {
    Modal.confirm({
      title: 'Delete Tag',
      content: 'Are you sure you want to delete this tag?',
      onOk: async () => {
        try {
          const response = await fetch(`http://localhost:6002/api/tags/${id}`, { method: 'DELETE' })
          const data = await response.json()
          if (data.success) {
            Message.success('Tag deleted')
            fetchTags()
          } else {
            Message.error(data.error || 'Failed to delete')
          }
        } catch (err: any) {
          Message.error(`Error: ${err.message}`)
        }
      }
    })
  }

  const handleToggleTagEnabled = async (id: number, currentEnabled: boolean | number) => {
    try {
      const is_enabled = currentEnabled === 1 || currentEnabled === true
      const response = await fetch(`http://localhost:6002/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !is_enabled })
      })
      const data = await response.json()
      if (data.success) {
        Message.success('Tag status updated')
        fetchTags()
      } else {
        Message.error(data.error || 'Failed to update status')
      }
    } catch (err: any) {
      Message.error(`Error: ${err.message}`)
    }
  }

  // Load initial data
  useEffect(() => {
    fetchJobs()
    fetchCrawlRecords()
    loadMockUsers()
    loadCaptchaLogs()
    fetchTags()
  }, [])

  const renderFilterPanel = () => {
    return (
      <Card style={{ marginBottom: '16px' }} title="🔍 Filter & Search Panel / 高级过滤与刷选">
        <Form layout="inline" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          <Form.Item label="Keyword">
            <Input
              placeholder="Search title, company..."
              value={filterKeyword}
              onChange={(val) => setFilterKeyword(val)}
              allowClear
              style={{ width: 180 }}
            />
          </Form.Item>
          <Form.Item label="Sort Order (>=)">
            <InputNumber
              placeholder="Min Sort Order"
              value={filterSortOrder}
              onChange={(val) => setFilterSortOrder(val)}
              min={0}
              style={{ width: 130 }}
            />
          </Form.Item>
          <Form.Item label="Status">
            <Select
              value={filterApproved}
              onChange={(val) => setFilterApproved(val)}
              style={{ width: 140 }}
            >
              <Select.Option value="all">All / 全部</Select.Option>
              <Select.Option value="approved">Approved / 已审批</Select.Option>
              <Select.Option value="pending">Pending / 待审批</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Source">
            <Select
              value={filterSource}
              onChange={(val) => setFilterSource(val)}
              style={{ width: 180 }}
            >
              <Select.Option value="all">All Sources / 全部</Select.Option>
              {uniqueSources.map(src => (
                <Select.Option key={src} value={src}>{src}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button
              type="outline"
              onClick={() => {
                setFilterKeyword('')
                setFilterSortOrder(undefined)
                setFilterApproved('all')
                setFilterSource('all')
              }}
            >
              Reset / 重置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    )
  }

  // Dynamic statistics
  const totalListings = totalJobsCount
  const totalExtracted = useMemo(() => {
    return crawlRecords.reduce((sum, record) => sum + (record.extracted_count || 0), 0)
  }, [crawlRecords])
  const featuredCount = useMemo(() => {
    return jobs.filter(j => j.is_featured === 1 || j.is_featured === true).length
  }, [jobs])

  // Table Columns
  const columns = [
    {
      title: 'Job Position',
      dataIndex: 'title',
      render: (text: string) => <Typography.Text bold>{text}</Typography.Text>
    },
    {
      title: 'Company',
      dataIndex: 'company',
      render: (text: string) => <span>{text}</span>
    },
    {
      title: 'Compensation',
      dataIndex: 'salary',
      render: (text: string) => <span style={{ fontWeight: 'bold' }}>{text || 'Not Specified'}</span>
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: (tagsStr: string) => {
        if (!tagsStr) return <span>-</span>
        const tagsList = tagsStr.split(',').map(t => t.trim()).filter(Boolean)
        return (
          <Space wrap size={[4, 4]}>
            {tagsList.map(tag => (
              <Tag 
                color="cyan" 
                key={tag}
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedKey('jobs')
                  setFilterKeyword(tag)
                }}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        )
      }
    },
    {
      title: 'Source',
      dataIndex: 'source',
      render: (text: string) => (
        <Tag color={text === 'manual' ? 'arcoblue' : 'purple'} style={{ textTransform: 'capitalize' }}>
          {text || 'manual'}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_approved',
      render: (val: any, record: JobRow) => {
        const approved = val === 1 || val === true
        return (
          <Space direction="vertical" size="mini">
            <Tag color={approved ? 'green' : 'orange'} style={{ borderRadius: '4px' }}>
              {approved ? 'Approved' : 'Pending'}
            </Tag>
            <Tag color={record.is_featured ? 'red' : 'gray'} style={{ borderRadius: '4px' }}>
              {record.is_featured ? 'Featured' : 'Standard'}
            </Tag>
          </Space>
        )
      }
    },
    {
      title: 'Sort Order',
      dataIndex: 'sort_order',
      sorter: (a: JobRow, b: JobRow) => a.sort_order - b.sort_order,
      render: (val: any) => <strong>{val || 0}</strong>
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      render: (text: string) => {
        if (!text) return '-'
        return <span>{new Date(text).toLocaleDateString()}</span>
      }
    },
    {
      title: 'Actions',
      render: (_: any, record: JobRow) => {
        const approved = record.is_approved === 1 || record.is_approved === true
        return (
          <Space>
            <Button
              size="mini"
              type="primary"
              status={approved ? 'warning' : 'success'}
              onClick={() => handleToggleApprove(record.id, !approved)}
            >
              {approved ? 'Disable' : 'Approve'}
            </Button>
            <Button
              size="mini"
              icon={<IconInfoCircle />}
              onClick={() => showDetailModal(record)}
            >
              Details
            </Button>
            <Button
              size="mini"
              type="outline"
              icon={<IconEdit />}
              onClick={() => showEditModal(record)}
            >
              Edit
            </Button>
            <Button
              size="mini"
              type="outline"
              status="danger"
              onClick={() => handleDeleteJob(record.id)}
            >
              Delete
            </Button>
          </Space>
        )
      }
    }
  ]

  const crawlColumns = [
    {
      title: 'Time Stamp',
      dataIndex: 'created_at',
      render: (text: string) => {
        if (!text) return '-'
        return <span>{new Date(text).toLocaleString()}</span>
      }
    },
    {
      title: 'Target URL',
      dataIndex: 'url',
      render: (text: string, record: CrawlRecord) => (
        <div style={{ wordBreak: 'break-all', maxWidth: '350px' }}>
          <span>{text}</span>
          {record.error_message && (
            <div style={{ color: '#f87171', fontSize: '11px', marginTop: '4px' }}>
              Error: {record.error_message}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => {
        let color = 'gold'
        if (status === 'SUCCESS') color = 'green'
        if (status === 'FAILED') color = 'red'
        return (
          <Tag color={color} style={{ fontWeight: 'bold' }}>
            {status}
          </Tag>
        )
      }
    },
    {
      title: 'Extracted Count',
      dataIndex: 'extracted_count',
      render: (count: number) => (
        <span style={{ fontWeight: 'bold' }}>
          {count || 0} jobs
        </span>
      )
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      {/* 1. Sidebar Panel */}
      <Sider
        breakpoint="lg"
        width={220}
      >
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '24px'
        }}>
          <Typography.Title heading={5} style={{ margin: 0 }}>
            💼 Web3Job Admin
          </Typography.Title>
        </div>
        <Menu
          selectedKeys={[selectedKey]}
          onClickMenuItem={(key) => setSelectedKey(key)}
          style={{ width: '100%', marginTop: '8px' }}
        >
          <MenuItem key="dashboard">
            <IconDashboard />
            Overview Dashboard
          </MenuItem>
          <MenuItem key="jobs">
            <IconList />
            Job Postings
          </MenuItem>
          <MenuItem key="settings">
            <IconSettings />
            Scraper Config
          </MenuItem>
          <MenuItem key="users">
            <IconUser />
            User Manager
          </MenuItem>
          <MenuItem key="tags">
            <IconTag />
            Tag Manager
          </MenuItem>
        </Menu>
      </Sider>
      
      {/* 2. Main Layout Area */}
      <Layout>
        {/* Header Bar */}
        <Header style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '24px',
          borderBottom: '1px solid #e5e6eb'
        }}>
          <Space size="large">
            <Tag color="arcoblue">
              <IconCheckCircle /> Connected to MySQL
            </Tag>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <IconUser />
              <span>Admin Operator</span>
            </div>
          </Space>
        </Header>

        {/* Content Pane */}
        <Content style={{ padding: '24px', maxWidth: '100%', width: '100%', margin: '0 auto' }}>
          <Breadcrumb style={{ marginBottom: '16px' }}>
            <Breadcrumb.Item>System Panel</Breadcrumb.Item>
            <Breadcrumb.Item style={{ textTransform: 'capitalize' }}>
              {selectedKey === 'settings' ? 'Scraper Config' : selectedKey === 'users' ? 'User Manager' : selectedKey === 'tags' ? 'Tag Manager' : selectedKey}
            </Breadcrumb.Item>
          </Breadcrumb>

          {/* Render Dashboard Tab */}
          {selectedKey === 'dashboard' && (
            <>
              <Card style={{ marginBottom: '24px' }}>
                <Title heading={3} style={{ marginTop: 0 }}>Portal Analytics Cockpit</Title>
                <Paragraph style={{ color: '#4e5969' }}>
                  Monitor raw metrics, active blockchain crawler jobs, verify parsed postings, and manage database records dynamically.
                </Paragraph>
              </Card>

              {/* Grid Stats */}
              <Grid.Row gutter={24} style={{ marginBottom: '24px' }}>
                <Grid.Col span={8}>
                  <Card style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography.Text style={{ color: '#4e5969' }}>Total Listings</Typography.Text>
                      <Button size="mini" shape="circle" icon={<IconRefresh />} onClick={fetchJobs} loading={loadingJobs} />
                    </div>
                    <Title heading={2} style={{ margin: '8px 0 0 0', color: '#165dff' }}>
                      {totalListings}
                    </Title>
                  </Card>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography.Text style={{ color: '#4e5969' }}>AI Extracted (Total)</Typography.Text>
                      <Button size="mini" shape="circle" icon={<IconRefresh />} onClick={fetchCrawlRecords} loading={loadingCrawl} />
                    </div>
                    <Title heading={2} style={{ margin: '8px 0 0 0', color: '#722ed1' }}>
                      {totalExtracted}
                    </Title>
                  </Card>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Card>
                    <Typography.Text style={{ color: '#4e5969' }}>Featured Listings</Typography.Text>
                    <Title heading={2} style={{ margin: '8px 0 0 0', color: '#ff7d00' }}>
                      {featuredCount}
                    </Title>
                  </Card>
                </Grid.Col>
              </Grid.Row>

              {/* Filter Panel */}
              {renderFilterPanel()}

              {/* Core Table */}
              <Card 
                title="Active Listings Manager" 
                extra={
                  <Space>
                    {selectedRowKeys.length > 0 && (
                      <Space>
                        <Button size="small" type="primary" status="success" onClick={() => handleBatchApprove(true)}>
                          Batch Approve ({selectedRowKeys.length})
                        </Button>
                        <Button size="small" type="primary" status="warning" onClick={() => handleBatchApprove(false)}>
                          Batch Disable ({selectedRowKeys.length})
                        </Button>
                      </Space>
                    )}
                    <Button size="small" type="primary" onClick={fetchJobs} loading={loadingJobs}>Refresh Jobs</Button>
                  </Space>
                }
              >
                <Table
                  columns={columns}
                  data={displayedJobs}
                  loading={loadingJobs}
                  pagination={{ pageSize: 10, sizeCanChange: true }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys)
                  }}
                />
              </Card>
            </>
          )}

          {/* Render Job Postings Tab */}
          {selectedKey === 'jobs' && (
            <>
              {renderFilterPanel()}
              <Card 
                title="Active Listings Manager" 
                extra={
                  <Space>
                    {selectedRowKeys.length > 0 && (
                      <Space>
                        <Button size="small" type="primary" status="success" onClick={() => handleBatchApprove(true)}>
                          Batch Approve ({selectedRowKeys.length})
                        </Button>
                        <Button size="small" type="primary" status="warning" onClick={() => handleBatchApprove(false)}>
                          Batch Disable ({selectedRowKeys.length})
                        </Button>
                      </Space>
                    )}
                    <Button size="small" type="primary" onClick={fetchJobs} loading={loadingJobs}>Refresh Jobs</Button>
                  </Space>
                }
              >
                <Table
                  columns={columns}
                  data={displayedJobs}
                  loading={loadingJobs}
                  pagination={{ pageSize: 10, sizeCanChange: true }}
                  rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys)
                  }}
                />
              </Card>
            </>
          )}

          {/* Render Scraper Config Tab */}
          {selectedKey === 'settings' && (
            <>
              <Card style={{ marginBottom: '24px' }} title="AI Scraper Controls">
                <Paragraph style={{ color: '#94a3b8', marginBottom: '16px' }}>
                  Target specific Web3 job posting pages to asynchronously invoke our deep crawler and parse them into structured MySQL databases.
                </Paragraph>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Input
                    style={{ flex: 3, height: '36px' }}
                    placeholder="Enter target remote job URL (e.g. blockchain-jobs.com/post-1)"
                    value={scraperUrl}
                    onChange={(val) => setScraperUrl(val)}
                  />
                  <Input
                    style={{ width: '100px', height: '36px' }}
                    type="number"
                    placeholder="Limit"
                    value={String(scraperLimit)}
                    onChange={(val) => setScraperLimit(parseInt(val, 10) || 1)}
                  />
                  <Button
                    type="primary"
                    icon={<IconPlayArrow />}
                    onClick={handleTriggerScraper}
                    loading={isScraping}
                    style={{ height: '36px' }}
                  >
                    Trigger Scraper
                  </Button>
                </div>
              </Card>

              <Card
                title="Unified Crawl & AI Extraction Logs (MySQL)"
                extra={
                  <Button size="small" type="primary" icon={<IconRefresh />} onClick={fetchCrawlRecords} loading={loadingCrawl}>
                    Refresh Logs
                  </Button>
                }
              >
                <Table
                  columns={crawlColumns}
                  data={crawlRecords}
                  loading={loadingCrawl}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </>
          )}

          {/* Render User Manager Tab */}
          {selectedKey === 'users' && (
            <>
              <Card style={{ marginBottom: '24px' }}>
                <Title heading={3} style={{ marginTop: 0 }}>User Management / 用户管理</Title>
                <Paragraph style={{ color: '#4e5969' }}>
                  View, manage and moderate registered user accounts. Toggle account status or remove users from the system.
                </Paragraph>
              </Card>

              {/* User Statistics */}
              <Grid.Row gutter={24} style={{ marginBottom: '24px' }}>
                <Grid.Col span={8}>
                  <Card>
                    <Typography.Text style={{ color: '#4e5969' }}>Total Users / 总用户数</Typography.Text>
                    <Title heading={2} style={{ margin: '8px 0 0 0', color: '#165dff' }}>
                      {mockUsers.length}
                    </Title>
                  </Card>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Card>
                    <Typography.Text style={{ color: '#4e5969' }}>Active Users / 活跃用户</Typography.Text>
                    <Title heading={2} style={{ margin: '8px 0 0 0', color: '#00b42a' }}>
                      {mockUsers.filter(u => u.status === 'Active').length}
                    </Title>
                  </Card>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Card>
                    <Typography.Text style={{ color: '#4e5969' }}>Disabled Users / 禁用用户</Typography.Text>
                    <Title heading={2} style={{ margin: '8px 0 0 0', color: '#f53f3f' }}>
                      {mockUsers.filter(u => u.status === 'Disabled').length}
                    </Title>
                  </Card>
                </Grid.Col>
              </Grid.Row>

              {/* User Table */}
              <Card
                title="Registered Users / 注册用户列表"
                extra={
                  <Button size="small" type="primary" icon={<IconRefresh />} onClick={loadMockUsers}>
                    Reload / 刷新
                  </Button>
                }
                style={{ marginBottom: '24px' }}
              >
                <Table
                  columns={[
                    {
                      title: 'Username / 用户名',
                      dataIndex: 'username',
                      render: (text: string) => <Typography.Text bold>{text}</Typography.Text>
                    },
                    {
                      title: 'Email / 邮箱',
                      dataIndex: 'email',
                      render: (text: string) => <span>{text}</span>
                    },
                    {
                      title: 'Status / 状态',
                      dataIndex: 'status',
                      render: (status: string) => (
                        <Tag color={status === 'Active' ? 'green' : 'red'} style={{ borderRadius: '4px' }}>
                          {status === 'Active' ? 'Active / 活跃' : 'Disabled / 禁用'}
                        </Tag>
                      )
                    },
                    {
                      title: 'Registered At / 注册时间',
                      dataIndex: 'registeredAt',
                      render: (text: string) => <span>{new Date(text).toLocaleString()}</span>
                    },
                    {
                      title: 'Actions / 操作',
                      render: (_: any, _record: MockUser, index: number) => {
                        const isActive = _record.status === 'Active'
                        return (
                          <Space>
                            <Button
                              size="mini"
                              type="primary"
                              status={isActive ? 'warning' : 'success'}
                              onClick={() => handleToggleUserStatus(index)}
                            >
                              {isActive ? 'Disable / 禁用' : 'Enable / 启用'}
                            </Button>
                            <Button
                              size="mini"
                              type="outline"
                              status="danger"
                              icon={<IconDelete />}
                              onClick={() => handleDeleteUser(index)}
                            >
                              Delete / 删除
                            </Button>
                          </Space>
                        )
                      }
                    }
                  ]}
                  data={mockUsers}
                  rowKey="email"
                  pagination={{ pageSize: 10, sizeCanChange: true }}
                />
              </Card>

              {/* Captcha Verification Audit Log */}
              <Card
                title="Verification Code Audit Log / 验证码审计日志"
                extra={
                  <Space>
                    <Button size="small" type="primary" icon={<IconRefresh />} onClick={loadCaptchaLogs}>
                      Reload / 刷新
                    </Button>
                    <Button size="small" type="outline" status="danger" icon={<IconDelete />} onClick={handleClearCaptchaLogs} disabled={captchaLogs.length === 0}>
                      Clear Logs / 清除日志
                    </Button>
                  </Space>
                }
              >
                {captchaLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#86909c' }}>
                    <Typography.Text>No captcha logs recorded yet. / 暂无验证码日志记录。</Typography.Text>
                  </div>
                ) : (
                  <Table
                    columns={[
                      {
                        title: 'Time / 时间',
                        dataIndex: 'time',
                        render: (text: string) => <span>{new Date(text).toLocaleString()}</span>
                      },
                      {
                        title: 'Email / 邮箱',
                        dataIndex: 'email',
                        render: (text: string) => <span>{text}</span>
                      },
                      {
                        title: 'Code / 验证码',
                        dataIndex: 'code',
                        render: (text: string) => (
                          <Tag color="arcoblue" style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>
                            {text}
                          </Tag>
                        )
                      },
                      {
                        title: 'Status / 状态',
                        dataIndex: 'status',
                        render: (status: string) => {
                          let color = 'gray'
                          if (status === 'sent' || status === 'Sent') color = 'green'
                          if (status === 'verified' || status === 'Verified') color = 'arcoblue'
                          if (status === 'expired' || status === 'Expired') color = 'orange'
                          if (status === 'failed' || status === 'Failed') color = 'red'
                          return <Tag color={color}>{status}</Tag>
                        }
                      }
                    ]}
                    data={captchaLogs}
                    rowKey={(record: CaptchaLog) => `${record.email}-${record.time}`}
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                )}
              </Card>
            </>
          )}
          {/* Tag Manager Tab */}
          {selectedKey === 'tags' && (
            <Card
              title="Tag Management / 标签管理"
              extra={
                <Space>
                  <Button size="small" type="outline" icon={<IconRefresh />} onClick={fetchTags}>
                    Reload / 刷新
                  </Button>
                  <Button size="small" type="primary" onClick={() => { setEditingTag(null); tagForm.resetFields(); setIsTagModalVisible(true) }}>
                    Add Tag / 新增标签
                  </Button>
                </Space>
              }
            >
              <Table
                loading={loadingTags}
                columns={[
                  { title: 'ID', dataIndex: 'id', width: 80 },
                  { 
                    title: 'Name / 标签名称', 
                    dataIndex: 'name',
                    render: (text: string) => <Typography.Text bold>{text}</Typography.Text>
                  },
                  {
                    title: 'Linked Jobs / 关联岗位数',
                    render: (_: any, record: TagRow) => {
                      const count = jobs.filter(j => (j.tags || '').toLowerCase().includes(record.name.toLowerCase())).length
                      return <Tag color="arcoblue">{count}</Tag>
                    }
                  },
                  {
                    title: 'Status / 状态',
                    dataIndex: 'is_enabled',
                    render: (val: any, record: TagRow) => {
                      const enabled = val === 1 || val === true
                      return (
                        <Switch
                          checked={enabled}
                          onChange={() => handleToggleTagEnabled(record.id, record.is_enabled)}
                        />
                      )
                    }
                  },
                  {
                    title: 'Created At / 创建时间',
                    dataIndex: 'created_at',
                    render: (text: string) => <span>{new Date(text).toLocaleString()}</span>
                  },
                  {
                    title: 'Actions / 操作',
                    render: (_: any, record: TagRow) => (
                      <Space>
                        <Button 
                          size="mini" 
                          icon={<IconEdit />}
                          onClick={() => { setEditingTag(record); tagForm.setFieldsValue(record); setIsTagModalVisible(true) }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="mini" 
                          type="outline" 
                          status="danger" 
                          icon={<IconDelete />}
                          onClick={() => handleDeleteTag(record.id)}
                        >
                          Delete
                        </Button>
                      </Space>
                    )
                  }
                ]}
                data={tagsData}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />

              {/* Add/Edit Tag Modal */}
              <Modal
                title={editingTag ? 'Edit Tag / 编辑标签' : 'Add Tag / 新增标签'}
                visible={isTagModalVisible}
                onOk={() => tagForm.submit()}
                onCancel={() => setIsTagModalVisible(false)}
              >
                <Form
                  form={tagForm}
                  onSubmit={handleCreateOrUpdateTag}
                  layout="vertical"
                >
                  <Form.Item 
                    label="Tag Name / 标签名称" 
                    field="name" 
                    rules={[{ required: true, message: 'Please enter a tag name' }]}
                  >
                    <Input placeholder="Enter tag name..." />
                  </Form.Item>
                  <Form.Item 
                    label="Enabled / 启用" 
                    field="is_enabled" 
                    initialValue={true} 
                    triggerPropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Form>
              </Modal>
            </Card>
          )}

        </Content>

        <Footer style={{
          textAlign: 'center',
          padding: '24px'
        }}>
          RemoteWeb3.com Portal System Admin Panel © 2026. Powered by Arco Design & Hono.
        </Footer>
      </Layout>

      {/* Edit Job Modal */}
      <Modal
        title="Edit Job Posting"
        visible={isEditVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setIsEditVisible(false)
          setEditingJob(null)
        }}
        autoFocus={false}
        focusLock={true}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Job Position" field="title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Solidity Architect" />
          </Form.Item>
          <Form.Item label="Company" field="company" rules={[{ required: true }]}>
            <Input placeholder="e.g. DeFi Syndicate" />
          </Form.Item>
          <Form.Item label="Compensation" field="salary">
            <Input placeholder="e.g. $140k - $200k + Equity" />
          </Form.Item>
          <Form.Item label="Source" field="source">
            <Input placeholder="e.g. web3.career" />
          </Form.Item>
          <Form.Item label="Tags (Comma separated)" field="tags">
            <Input placeholder="e.g. Solidity,Ethereum,Security" />
          </Form.Item>
          <Form.Item label="Sort Order" field="sort_order">
            <InputNumber min={0} placeholder="Default is 0. Higher numbers are displayed first." />
          </Form.Item>
          <Form.Item label="Featured Listing" field="is_featured" triggerPropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Approved / Enabled" field="is_approved" triggerPropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Application URL" field="apply_url">
            <Input placeholder="e.g. https://apply-here.com" />
          </Form.Item>
          <Form.Item label="Job Description (Markdown supported)" field="description">
            <Input.TextArea placeholder="Enter job summary and requirements..." autoSize={{ minRows: 4, maxRows: 10 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Job Detail Modal */}
      <Modal
        title="Job Listing Details / 岗位详情"
        visible={isDetailVisible}
        footer={
          <Button type="primary" onClick={() => setIsDetailVisible(false)}>
            Close / 关闭
          </Button>
        }
        onCancel={() => setIsDetailVisible(false)}
        width={1000}
        style={{ maxHeight: '80vh', overflow: 'auto' }}
      >
        {detailedJob && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions
              column={1}
              title="Job Specifications / 岗位指标"
              border
              data={[
                { label: 'Job ID / 标识', value: detailedJob.id },
                { label: 'Job Position / 岗位名称', value: <strong>{detailedJob.title}</strong> },
                { label: 'Company / 招聘公司', value: detailedJob.company },
                { label: 'Compensation / 薪资待遇', value: <span style={{ fontWeight: 'bold', color: '#ff7d00' }}>{detailedJob.salary || 'Not Specified / 未标明'}</span> },
                { label: 'Source / 数据来源', value: <Tag color={detailedJob.source === 'manual' ? 'arcoblue' : 'purple'}>{detailedJob.source || 'manual'}</Tag> },
                { label: 'Sort Order / 排序权重', value: <strong style={{ color: '#165dff' }}>{detailedJob.sort_order || 0}</strong> },
                { label: 'Created At / 导入时间', value: new Date(detailedJob.created_at).toLocaleString() },
                { label: 'Updated At / 更新时间', value: new Date(detailedJob.updated_at).toLocaleString() },
                { label: 'Featured Status / 推荐状态', value: <Tag color={detailedJob.is_featured ? 'red' : 'gray'}>{detailedJob.is_featured ? 'Featured' : 'Standard'}</Tag> },
                { label: 'Approval Status / 审核状态', value: <Tag color={detailedJob.is_approved ? 'green' : 'orange'}>{detailedJob.is_approved ? 'Approved' : 'Pending'}</Tag> },
                {
                  label: 'Apply URL / 申请链接',
                  span: 2,
                  value: detailedJob.apply_url ? (
                    <a href={detailedJob.apply_url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                      {detailedJob.apply_url}
                    </a>
                  ) : 'Not Provided / 未提供'
                }
              ]}
            />
            
            <div>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#1d2129' }}>Tags / 岗位标签:</strong>
              <Space wrap size={[6, 6]}>
                {(detailedJob.tags || '').split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                  <Tag color="cyan" key={tag}>{tag}</Tag>
                ))}
                {!(detailedJob.tags || '').trim() && <span>-</span>}
              </Space>
            </div>

            <div>
              <strong style={{ display: 'block', marginBottom: '8px', color: '#1d2129' }}>Job Description / 完整描述:</strong>
              <div style={{
                padding: '16px',
                background: '#f4f5f8',
                borderRadius: '6px',
                color: '#1d2129',
                whiteSpace: 'pre-wrap',
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #e5e6eb',
                fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
                fontSize: '13px',
                lineHeight: 1.6
              }}>
                {detailedJob.description || 'No description provided.'}
              </div>
            </div>
          </Space>
        )}
      </Modal>

    </Layout>
  )
}
