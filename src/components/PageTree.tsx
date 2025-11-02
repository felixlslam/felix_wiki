import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  Typography,
  Collapse,
  Box
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Article as ArticleIcon,
  Folder as FolderIcon,
  Add as AddIcon
} from '@mui/icons-material'

interface Article {
  id: number
  slug: string
  title: string
  createdAt: string
  updatedAt: string
  parentSlug?: string
}

interface PageTreeProps {
  articles: Article[]
  onNewSubpage?: (parentSlug: string) => void
}

interface TreeNode {
  name: string
  slug?: string
  children: { [key: string]: TreeNode }
  article?: Article
}

function buildTree(articles: Article[]): TreeNode {
  const root: TreeNode = { name: 'root', children: {} }
  const nodeMap: { [key: string]: TreeNode } = {}
  
  // First pass: create all nodes
  articles
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach(article => {
      const node: TreeNode = {
        name: article.title,
        slug: article.slug,
        children: {},
        article
      }
      nodeMap[article.slug] = node
    })
  
  // Second pass: build hierarchy
  articles.forEach(article => {
    const node = nodeMap[article.slug]
    if (article.parentSlug && nodeMap[article.parentSlug]) {
      nodeMap[article.parentSlug].children[article.slug] = node
    } else {
      root.children[article.slug] = node
    }
  })
  
  return root
}

function TreeNodeComponent({ node, level = 0, onNewSubpage, expanded = true, onToggle, isExpanded, getNodeRef }: { node: TreeNode, level?: number, onNewSubpage?: (parentSlug: string) => void, expanded?: boolean, onToggle?: (slug?: string) => void, isExpanded?: (slug?: string) => boolean, getNodeRef?: (slug: string, el: HTMLElement | null) => void }) {
  const location = useLocation()
  const hasChildren = Object.keys(node.children).length > 0
  const isActive = node.slug && location.pathname === `/a/${node.slug}`
  const thisExpanded = typeof isExpanded === 'function' ? isExpanded(node.slug) : expanded

  return (
    <>
      <ListItem
        ref={node.slug && getNodeRef ? (el: HTMLElement | null) => getNodeRef(node.slug!, el) : undefined}
        dense
        sx={{
          py: 0.25,
          color: isActive ? 'primary.main' : 'text.primary',
          '&:hover': {
            bgcolor: 'action.hover',
            '& .add-subpage': { opacity: 1 }
          },
        }}
      >
        {/* Spacer for indentation - pushes all content (icons + text) to the right */}
        <Box sx={(theme) => ({ width: theme.spacing(level * 3), flexShrink: 0 })} />
        
        {node.slug && (
          <IconButton
            size="small"
            className="add-subpage"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onNewSubpage?.(node.slug!)
            }}
            sx={{ 
              opacity: 0,
              transition: 'opacity 0.2s',
              mr: 0.5,
              p: 0,
              width: 20,
              height: 20,
              '& svg': { fontSize: '0.8rem' }
            }}
            title="Add subpage"
          >
            <AddIcon />
          </IconButton>
        )}
        {hasChildren && (
          <ListItemIcon sx={{ minWidth: 28 }}>
            <IconButton
              size="small"
              onClick={() => onToggle?.(node.slug)}
              sx={{ 
                p: 0,
                width: 20,
                height: 20,
                '& svg': {
                  fontSize: '1rem'
                }
              }}
            >
              {thisExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          </ListItemIcon>
        )}
        
        <ListItemIcon sx={{ minWidth: 28 }}>
          {node.slug ? <ArticleIcon sx={{ fontSize: '1.1rem' }} /> : <FolderIcon sx={{ fontSize: '1.1rem' }} />}
        </ListItemIcon>

        <ListItemText
          primary={
            node.slug ? (
              <Link
                to={`/a/${node.slug}`}
                style={{ 
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                {node.name}
              </Link>
            ) : (
              <Typography variant="body2">{node.name}</Typography>
            )
          }
        />
      </ListItem>
      
      {hasChildren && thisExpanded && (
        <Collapse in={thisExpanded}>
          <List disablePadding>
            {Object.entries(node.children)
              .sort(([,a], [,b]) => a.name.localeCompare(b.name))
              .map(([key, child]) => (
                <TreeNodeComponent key={key} node={child} level={level + 1} onNewSubpage={onNewSubpage} expanded={false} onToggle={onToggle} isExpanded={isExpanded} getNodeRef={getNodeRef} />
              ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

export default function PageTree({ articles, onNewSubpage }: PageTreeProps) {
  const tree = useMemo(() => buildTree(articles), [articles])
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(new Set())
  const nodeRefs = useRef(new Map<string, HTMLElement>())
  const location = useLocation()

  // build parent map for quick ancestor traversal
  const parentMap = useMemo(() => {
    const map: { [k: string]: string | undefined } = {}
    articles.forEach(a => { map[a.slug] = a.parentSlug })
    return map
  }, [articles])

  useEffect(() => {
    // when route changes to an article, expand ancestors and scroll into view
    const m = location.pathname.match(/^\/a\/(.+)$/)
    if (!m) return
    const slug = decodeURIComponent(m[1])
    // compute ancestors
    const ancestors: string[] = []
    let cur = parentMap[slug]
    while (cur) {
      ancestors.push(cur)
      cur = parentMap[cur]
    }
    const newSet = new Set(expandedSlugs)
    ancestors.forEach(s => newSet.add(s))
    setExpandedSlugs(newSet)

    // scroll into view after a tick so that expansions render
    setTimeout(() => {
      const el = nodeRefs.current.get(slug)
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, articles])

  const handleToggle = (slug?: string) => {
    if (!slug) return
    setExpandedSlugs(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <nav className="nav-tree">
      <Paper elevation={1} sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 1, border: '1px solid', borderColor: 'divider', boxShadow: (theme) => theme.shadows[1] }}>
        <List disablePadding>
          {Object.entries(tree.children)
            .sort(([,a], [,b]) => a.name.localeCompare(b.name))
            .map(([key, node]) => (
              <TreeNodeComponent
                key={key}
                node={node}
                onNewSubpage={onNewSubpage}
                expanded={node.slug ? expandedSlugs.has(node.slug) : true}
                onToggle={handleToggle}
                isExpanded={(slug) => slug ? expandedSlugs.has(slug) : true}
                getNodeRef={(slug, el) => {
                  if (!slug) return
                  if (el) nodeRefs.current.set(slug, el)
                  else nodeRefs.current.delete(slug)
                }}
              />
            ))}
        </List>
      </Paper>
    </nav>
  )
}
