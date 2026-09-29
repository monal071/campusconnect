/**
 * Pagination utility for API endpoints
 */

export function getPaginationParams(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit, 10) || 20),
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

export async function paginatedQuery(collection, filter = {}, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
    projection = null,
  } = options;

  const skip = (page - 1) * limit;

  // Get total count (for pagination info)

  // Get paginated data
  let cursor = collection.find(filter);

  if (projection) {
    cursor = cursor.project(projection);
  }

  if (sort) {
    cursor = cursor.sort(sort);
  }

  const [total, data] = await Promise.all([
    collection.countDocuments(filter),
    cursor.skip(skip).limit(limit).toArray(),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  };
}
