# Architecture Design Document—Database Repositories

# Intention

Database repositories are intended to be read layer of application.

Database repositories public interface MUST operate on orm models.

I do not use ORM repositories directly to limit their public interface to the minimum. 

Database repositories when performance is a concern might use raw SQL queries.