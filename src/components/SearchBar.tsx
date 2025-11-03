import React, { useState, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress, Box, ListItem, Typography } from '@mui/material'
import { Folder as FolderIcon, Article as ArticleIcon } from '@mui/icons-material'
import * as api from '../api'

interface SearchBarProps {
  onSelect?: (result: any) => void
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [q, setQ] = useState('')
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // debounce search
  useEffect(() => {
    if (!q || q.length < 2) {
      setOptions([])
      return
    }
    let cancelled = false
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        // Use unified search for spaces + articles
        const res = await api.articles.searchAll(q, { limit: 25 })
        if (!cancelled) {
          setOptions(res.results || [])
        }
      } catch (err) {
        console.error('Search failed', err)
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q])

  return (
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={(o: any) => {
        if (o.type === 'space') return o.name || ''
        return o.title || o.slug || ''
      }}
      onChange={(_, value) => {
        if (value && typeof value === 'object') {
          if (onSelect) onSelect(value)
          // Clear input after selection to show placeholder
          setQ('')
          setOptions([])
          // ensure Autocomplete internal state resets; run after tick
          setTimeout(() => setQ(''), 0)
        }
      }}
      filterOptions={(x) => x} // we rely on server
      onInputChange={(_, value) => setQ(value)}
      inputValue={q}
      sx={{ width: { xs: 220, sm: 320, md: 420 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search pages or spaces"
          size="small"
          aria-label="Search pages or spaces"
          sx={{
            // ensure high contrast input regardless of appbar color / theme
            '& .MuiInputBase-root': (theme) => ({
              bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'common.white',
              color: theme.palette.text.primary,
              borderRadius: 1,
              boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.6)' : '0 1px 2px rgba(16,24,40,0.06)',
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': { boxShadow: theme.palette.mode === 'dark' ? '0 2px 6px rgba(0,0,0,0.6)' : '0 2px 4px rgba(16,24,40,0.08)' }
            }),
            // placeholder color should be readable
            '& .MuiInputBase-input::placeholder': (theme) => ({ color: theme.palette.text.secondary })
          }}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
      renderOption={(props, option: any) => {
        const { key, ...restProps } = props as any
        if (option.type === 'space') {
          return (
            <ListItem {...restProps} key={key || option.slug} sx={{ alignItems: 'center', gap: 1 }}>
              <FolderIcon fontSize="small" color="primary" />
              <Box>
                <Typography variant="body2"><strong>{option.name}</strong></Typography>
                <Typography variant="caption" color="text.secondary">Space</Typography>
              </Box>
            </ListItem>
          )
        }
        return (
          <ListItem {...restProps} key={key || option.slug} sx={{ alignItems: 'flex-start', gap: 1 }}>
            <ArticleIcon fontSize="small" sx={{ mt: 0.5 }} />
            <Box>
              <Typography variant="body2"><strong>{option.title}</strong></Typography>
              {option.excerpt && (
                <Typography variant="caption" color="text.secondary">{option.excerpt}</Typography>
              )}
            </Box>
          </ListItem>
        )
      }}
    />
  )
}
