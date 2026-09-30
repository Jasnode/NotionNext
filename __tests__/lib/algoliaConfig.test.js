jest.mock('@/blog.config', () => ({
  ALGOLIA_APP_ID: 'test-app',
  ALGOLIA_ADMIN_APP_KEY: '',
  ALGOLIA_INDEX: 'posts'
}))
jest.mock('algoliasearch', () => jest.fn())
jest.mock('@/lib/db/notion/getPageContentText', () => ({ getPageContentText: jest.fn() }))

import algoliasearch from 'algoliasearch'
import { checkDataFromAlgolia, uploadDataToAlgolia } from '@/lib/plugins/algolia'

it('skips index reads and writes when the admin key is absent', async () => {
  await expect(uploadDataToAlgolia({ id: 'post' })).resolves.toBeUndefined()
  await expect(checkDataFromAlgolia({ allPages: [{ id: 'post', password: 'private' }] }))
    .resolves.toBeUndefined()
  expect(algoliasearch).not.toHaveBeenCalled()
})
