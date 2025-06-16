module.exports = (objectPagination, allBlogs, query) => {
    if (query.page) {
        objectPagination.currentPage = parseInt(query.page);
    }

    objectPagination.skip = (objectPagination.currentPage - 1) * objectPagination.limit;

    const page = Math.ceil(allBlogs / objectPagination.limit)
    objectPagination.totalPage = page;

    return objectPagination;
}