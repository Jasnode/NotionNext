// Notion 单选分类是字符串；兼容已有数组形式，均只匹配完整分类名。
export const postHasCategory = (post, category) =>
  Array.isArray(post?.category)
    ? post.category.includes(category)
    : post?.category === category
