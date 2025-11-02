import React, { useState, useEffect, useMemo } from 'react'
import { Autocomplete, TextField, CircularProgress, Box, ListItem, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'

interface SearchBarProps {
  onSelect?: (result: any) => void
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [q, setQ] = useState('')
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // debounce
  useEffect(() => {
    if (!q || q.length < 2) {
      setOptions([])
      return
    }
    let cancelled = false
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        // No space param: search across all spaces
        const res = await api.articles.search(q, { limit: 25 })
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
      getOptionLabel={(o: any) => o.title || o.slug || ''}
      onChange={(_, value) => {
        if (value && value.slug) {
          // Let parent handle space switching if provided
          if (onSelect) onSelect(value)
          else navigate(`/a/${value.slug}`)
        }
      }}
      filterOptions={(x) => x} // we rely on server
      onInputChange={(_, value) => setQ(value)}
      inputValue={q}
      sx={{ width: { xs: 220, sm: 320, md: 420 } }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search..."
          size="small"
          aria-label="Search articles"
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
      renderOption={(props, option: any) => (
        <ListItem {...props} key={option.slug} sx={{ alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2"><strong>{option.title}</strong></Typography>
            <Typography variant="caption" color="text.secondary">{option.excerpt}</Typography>
          </Box>
        </ListItem>
      )}
    />
  )
}
