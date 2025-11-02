import React from 'react'
import { Link } from 'react-router-dom'
import { Typography, List, ListItem, ListItemText, Paper } from '@mui/material'

interface Article {
  id: number
  slug: string
  title: string
  createdAt: string
  updatedAt: string
}

interface HomeProps {
  articles: Article[]
}

export default function Home({ articles }: HomeProps) {
  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Recent Articles</Typography>
      <List>
        {articles.map(a => (
          <ListItem
            key={a.id}
            component={Link}
            to={`/a/${a.slug}`}
            sx={{
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemText
              primary={a.title}
              secondary={`Updated ${new Date(a.updatedAt).toLocaleDateString()}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}
