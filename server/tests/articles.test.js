const fs = require('fs')
const path = require('path')
const request = require('supertest')
const app = require('../index')

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json')

function resetDB() {
  const init = { articles: [] }
  fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2))
}

describe('Articles API', () => {
  beforeEach(() => {
    resetDB()
  })

  test('creates parent and child article with parentSlug and list includes parentSlug', async () => {
    // create parent
    const parentRes = await request(app)
      .post('/api/articles')
      .send({ title: 'Parent Test', bodyMarkdown: 'parent body' })
      .expect(201)

    expect(parentRes.body).toHaveProperty('slug')
    const parentSlug = parentRes.body.slug

    // create child with parentSlug
    const childRes = await request(app)
      .post('/api/articles')
      .send({ title: 'Child Test', bodyMarkdown: 'child body', parentSlug })
      .expect(201)

    expect(childRes.body).toHaveProperty('parentSlug', parentSlug)
    expect(childRes.body).toHaveProperty('slug')

    // list articles
    const listRes = await request(app)
      .get('/api/articles')
      .expect(200)

    // find child in list
    const child = listRes.body.find(a => a.slug === childRes.body.slug)
    expect(child).toBeDefined()
    expect(child).toHaveProperty('parentSlug', parentSlug)
  })

  test('editing child does not remove parentSlug', async () => {
    // create parent
    const parentRes = await request(app)
      .post('/api/articles')
      .send({ title: 'Parent For Edit', bodyMarkdown: 'parent body' })
      .expect(201)

    const parentSlug = parentRes.body.slug

    // create child with parentSlug
    const childRes = await request(app)
      .post('/api/articles')
      .send({ title: 'Child For Edit', bodyMarkdown: 'child body', parentSlug })
      .expect(201)

    const childSlug = childRes.body.slug

    // update child title
    await request(app)
      .put(`/api/articles/${childSlug}`)
      .send({ title: 'Child For Edit - Updated' })
      .expect(200)

    // list articles and ensure child still has parentSlug
    const listRes = await request(app)
      .get('/api/articles')
      .expect(200)

    const child = listRes.body.find(a => a.slug === childSlug)
    expect(child).toBeDefined()
    expect(child).toHaveProperty('parentSlug', parentSlug)
  })
})
