E-Commerce Site
===============

Overview
--------

This project is a full-stack e-commerce web application built using the following technologies:

*   **Frontend:** HTML, CSS, JavaScript, EJS (Embedded JavaScript Templates)
    
*   **Backend:** Node.js, Express.js
    
*   **Database:** PostgreSQL
    
*   **Authentication:** OAuth for secure user login
    

The application allows users to browse products, manage their cart and wishlist.

Features
--------

### User Authentication

*   Secure login and signup using OAuth (e.g., Google, GitHub).
    
*   Password hashing using bcrypt for local authentication.
    

### Product Management

*   Product listing with options to sort and search by category, price, and relevance.
    
*   Detailed product view for each item.
    

### Cart and Wishlist

*   Add/remove products to/from the cart and wishlist.
    
*   Manage item quantities in the cart.
    

### Checkout

*   Proceed to checkout with a "Proceed to Checkout" button.
    

### Admin Panel (Optional)

*   Add, update, or delete products.
    
Installation and Setup
----------------------

### Prerequisites

Ensure you have the following installed on your machine:

*   Node.js (v16 or higher)
    
*   PostgreSQL
    
*   npm (Node Package Manager)
    

### Steps

1.  git clone cd
    
2.  npm install
    
3.  **Setup Database:**
    
    *   Open pgAdmin and create a new PostgreSQL database.
        
    *   Manually create the required tables in the database. (Refer to the application's schema below.)
        
4.  **Create a .env file in the project root and configure the following:**

         GOOGLE_CLIENT_ID=""

        GOOGLE_CLIENT_SECRET=""

        SESSION_SECRET=""

         PG_USER=""

        PG_HOST="localhost"

        PG_DATABASE=""

        PG_PASSWORD=""

        PG_PORT=""
    
5.  node index.js

        The server will be running at http://localhost:3000.
    

Database Schema
---------------

Below is the schema for the PostgreSQL database used in this application:

CREATE TABLE users (

    id              SERIAL PRIMARY KEY,

    email           VARCHAR(255) UNIQUE NOT NULL,

    password        VARCHAR(255) NOT NULL,

    oauth_provider  VARCHAR(50),

    oauth_id        VARCHAR(255),

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


CREATE TABLE products (

    id              SERIAL PRIMARY KEY,

    name            VARCHAR(255) NOT NULL,

    description     TEXT,

    price           DECIMAL(10, 2) NOT NULL,

    image_url       VARCHAR(255),

    category        VARCHAR(100),

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


CREATE TABLE cart (

    id              SERIAL PRIMARY KEY,

    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,

    product_id      INTEGER REFERENCES products(id) ON DELETE CASCADE,

    quantity        INTEGER NOT NULL

);


CREATE TABLE wishlist (

    id              SERIAL PRIMARY KEY,

    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,

    product_id      INTEGER REFERENCES products(id) ON DELETE CASCADE

);


CREATE TABLE orders (

    id              SERIAL PRIMARY KEY,

    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,

    total_amount    DECIMAL(10, 2) NOT NULL,

    status          VARCHAR(100),

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


CREATE TABLE order_items (

    id              SERIAL PRIMARY KEY,

    order_id        INTEGER REFERENCES orders(id) ON DELETE CASCADE,

    product_id      INTEGER REFERENCES products(id) ON DELETE CASCADE,

    quantity        INTEGER NOT NULL,

    price           DECIMAL(10, 2) NOT NULL

);


Future Enhancements
-------------------

*   Add real-time notifications for order updates.
    
*   Integrate a recommendation system for personalized shopping.
    
*   Implement multi-language support.
    

Contact
-------

If you have any questions or need support, feel free to reach out:

Email:[beingshresth4@gmail.com](mailto:beingshresth4@gmail.com)

GitHub: Shresth-12([https://github.com/Shresth-12](https://github.com/Shresth-12))
