# Technical Design Document—Application Repositories

# Intention

Application repositories are intended to be read layer of application. 

Application repositories public interface MUST operate on orm models.

Application repositories when performance is a concern might use raw SQL queries.