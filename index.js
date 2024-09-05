import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors"

// Load environment variables from .env file
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;
const saltRounds = 10;

// Configure session management
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: process.env.NODE_ENV === 'production' }
    })
);

// Middleware configuration
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

db.connect().catch(err => console.error('Connection error', err.stack));

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.send('<script>alert("Please login or register."); window.location.href = "/login";</script>');
    }
}


let category=" ";
// Routes
app.get("/", async (req, res) => {
    try {
        const itemsResult = await db.query("SELECT * FROM items");
        const items = itemsResult.rows;

        let cartnumber = 0;
        let wishnumber = 0;
        let mennumber;
        let womennumber;
        let kidsnumber;
        let footwearnumber;
        
        const men = await db.query("SELECT * FROM items WHERE category = $1", ["Men"]);
        mennumber=men.rows.length;

        const women = await db.query("SELECT * FROM items WHERE category = $1", ["Women"]);
        womennumber=women.rows.length;

        const kids = await db.query("SELECT * FROM items WHERE category = $1", ["Kids"]);
        kidsnumber=kids.rows.length;

        const footwear = await db.query("SELECT * FROM items WHERE category = $1", ["Footwear"]);
        footwearnumber=footwear.rows.length;
        

        if (req.isAuthenticated()) {
            const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
            cartnumber = cartResult.rows.length;

            const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
            wishnumber = wishlistResult.rows.length;
        }

        res.render("index", {
            item: items,
            cn: cartnumber,
            wn: wishnumber,
            mn: mennumber,
             won:womennumber,
             kn:kidsnumber,
             fn:footwearnumber,
            isAuthenticated: req.isAuthenticated()
        });
    } catch (error) {
        console.error("Error fetching items:", error.message);
        res.render("index", { 
            item: [],
            cn: 0,
            wn: 0,
            isAuthenticated: false,
            error: error.message 
        });
    }
});
app.get("/cart", isAuthenticated, async (req, res) => {
    try {
        const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
        const cartitems = cartResult.rows;
        const cartnumber = cartitems.length;

        const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
        const wishnumber = wishlistResult.rows.length;

        const items = [];
        for (let i = 0; i < cartitems.length; i++) {
            const itemResult = await db.query("SELECT * FROM items WHERE id = $1", [cartitems[i].product_id]);
            if (itemResult.rows.length > 0) {
                items.push(itemResult.rows[0]);
            }
        }

        res.render("cart", {
            item: items,
            cn: cartnumber,
            wn: wishnumber,
            isAuthenticated: req.isAuthenticated()
        });
    } catch (error) {
        console.error("Error fetching items:", error.message);
        res.render("index", { 
            item: [],
            cn: 0,
            wn: 0,
            isAuthenticated: false,
            error: error.message 
        });
    }
});

app.get("/wishlist", isAuthenticated, async (req, res) => {
    try {

        const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
        const cartitems = cartResult.rows;
        const cartnumber = cartitems.length;

        const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
        const wishnumber = wishlistResult.rows.length;
        const wishlistitems = wishlistResult.rows;
        const items = [];
        for (let i = 0; i < wishlistitems.length; i++) {
            const itemResult = await db.query("SELECT * FROM items WHERE id = $1", [wishlistitems[i].product_id]);
            if (itemResult.rows.length > 0) {
                items.push(itemResult.rows[0]);
            }
        }
        res.render("wishlist", { 
            item: items,
            cn: cartnumber,
            wn: wishnumber,
            isAuthenticated: req.isAuthenticated() 
        });
    } catch (error) {
        console.error("Error fetching wishlist items:", error.message);
        res.render("wishlist", { error: error.message });
    }
});

app.get("/search", (req, res) => {
    res.render("add");
});

app.post("/new", async (req, res) => {
    const { name, rating, price, category, image } = req.body;
    try {
        await db.query("INSERT INTO items (name, rating, price, category, image) VALUES ($1, $2, $3, $4, $5)", [name, rating, price, category, image]);
        res.redirect("/");
    } catch (error) {
        console.error("Error adding new item:", error.message);
        res.redirect("/search");
    }
});

app.get("/product", async (req, res) => {
    const show = req.query.category;
    category=show;
    try {
        const itemsResult = await db.query("SELECT * FROM items WHERE category = $1", [show]);
        const items = itemsResult.rows;
        let cartnumber = 0;
        let wishnumber = 0;
        if (req.isAuthenticated()) {
            const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
            cartnumber = cartResult.rows.length;

            const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
            wishnumber = wishlistResult.rows.length;
        }
        res.render("product", {
            item: items,
            cn: cartnumber,
            wn: wishnumber,
            isAuthenticated: req.isAuthenticated()
        });
    } catch (error) {
        console.error("Error fetching items:", error.message);
        res.render("index", { 
            item: [],
            cn: 0,
            wn: 0,
            isAuthenticated: false,
            error: error.message 
        });
    }
});

app.post("/addtocart", isAuthenticated, async (req, res) => {
    const { addtocart: id } = req.body;
    try {
        if (!id) {
            throw new Error("Product ID is missing.");
        }

        const result = await db.query("SELECT * FROM cart WHERE product_id = $1 AND user_id = $2", [id, req.user.id]);
        if (result.rows.length > 0) {
            return res.send('<script>alert("Item is already in the cart."); window.location.href = "/";</script>');
        }

        await db.query("INSERT INTO cart (product_id, user_id) VALUES ($1, $2)", [id, req.user.id]);
        res.redirect("/");
    } catch (error) {
        console.error("Error adding item to cart:", error.message);
        res.redirect("/");
    }
});

app.post("/addtowishlist", isAuthenticated, async (req, res) => {
    const { addtowishlist: id } = req.body;
    try {
        if (!id) {
            throw new Error("Product ID is missing.");
        }

        const result = await db.query("SELECT * FROM wishlist WHERE product_id = $1 AND user_id = $2", [id, req.user.id]);
        if (result.rows.length > 0) {
            return res.send('<script>alert("Item is already in the wishlist."); window.location.href = "/";</script>');
        }

        await db.query("INSERT INTO wishlist (product_id, user_id) VALUES ($1, $2)", [id, req.user.id]);
        res.redirect("/");
    } catch (error) {
        console.error("Error adding item to wishlist:", error.message);
        res.redirect("/");
    }
});

app.post("/delwish", isAuthenticated, async (req, res) => {
    const { delete: id } = req.body;
    try {
        await db.query("DELETE FROM wishlist WHERE product_id = $1 AND user_id = $2", [id, req.user.id]);
        res.redirect("/wishlist");
    } catch (error) {
        console.error("Error deleting item from wishlist:", error.message);
        res.redirect("/wishlist");
    }
});

app.post("/delcart", isAuthenticated, async (req, res) => {
    const { delete: id } = req.body;
    try {
        await db.query("DELETE FROM cart WHERE product_id = $1 AND user_id = $2", [id, req.user.id]);
        res.redirect("/cart");
    } catch (error) {
        console.error("Error deleting item from wishlist:", error.message);
        res.redirect("/cart");
    }
});

app.get("/home", (req, res) => {
    res.redirect("/");
});

app.post("/productinfo", async (req, res) => {

    let id=req.body.aboutproduct;
    let cartnumber = 0;
    let wishnumber = 0;
    if (req.isAuthenticated()) {
        const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
        cartnumber = cartResult.rows.length;

        const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
        wishnumber = wishlistResult.rows.length;
    }
    const itemsResult = await db.query("SELECT * FROM items WHERE id= $1",[id]);
        const items = itemsResult.rows;

    res.render("product-description",{
            item:items,
            cn: cartnumber,
            wn: wishnumber,
            isAuthenticated: req.isAuthenticated()
    });
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
    })
);

app.post("/register", async (req, res) => {
    const { username: email, password, firstname, lastname } = req.body;

    try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);

        if (checkResult.rows.length > 0) {
            res.redirect("/login");
        } else {
            const hash = await bcrypt.hash(password, saltRounds);
            const result = await db.query(
                "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
                [email, hash]
            );
            const user = result.rows[0];
            req.login(user, (err) => {
                if (err) {
                    console.error("Error during login:", err);
                    return res.redirect("/register");
                }
                res.redirect("/");
            });
        }
    } catch (err) {
        console.error("Error during registration:", err);
        res.redirect("/register");
    }
});

passport.use(
    new LocalStrategy(
        {
            usernameField: "username",
            passwordField: "password",
        },
        async (username, password, done) => {
            try {
                const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);

                if (result.rows.length > 0) {
                    const user = result.rows[0];
                    const match = await bcrypt.compare(password, user.password);

                    if (match) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: "Incorrect password." });
                    }
                } else {
                    return done(null, false, { message: "User not found." });
                }
            } catch (err) {
                console.error("Error authenticating user:", err);
                return done(err);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
        const user = result.rows[0];
        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

// Google OAuth Configuration
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/callback",
            passReqToCallback: true,
        },
        async (request, accessToken, refreshToken, profile, done) => {
            try {
                const result = await db.query("SELECT * FROM users WHERE google_id = $1", [profile.id]);

                if (result.rows.length > 0) {
                    const user = result.rows[0];
                    return done(null, user);
                } else {
                    const newUserResult = await db.query(
                        "INSERT INTO users (google_id, email) VALUES ($1, $2) RETURNING *",
                        [profile.id, profile.email]
                    );
                    const newUser = newUserResult.rows[0];
                    return done(null, newUser);
                }
            } catch (err) {
                console.error("Error during Google authentication:", err);
                return done(err);
            }
        }
    )
);


app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "/",
        failureRedirect: "/login",
    })
);

app.get("/shop",async (req,res)=>{
    try {
        const itemsResult = await db.query("SELECT * FROM items");
        const items = itemsResult.rows;

        let cartnumber = 0;
        let wishnumber = 0;
        let mennumber;
        let womennumber;
        let kidsnumber;
        let footwearnumber;
        
        const men = await db.query("SELECT * FROM items WHERE category = $1", ["Men"]);
        mennumber=men.rows.length;

        const women = await db.query("SELECT * FROM items WHERE category = $1", ["Women"]);
        womennumber=women.rows.length;

        const kids = await db.query("SELECT * FROM items WHERE category = $1", ["Kids"]);
        kidsnumber=kids.rows.length;

        const footwear = await db.query("SELECT * FROM items WHERE category = $1", ["Footwear"]);
        footwearnumber=footwear.rows.length;
        

        if (req.isAuthenticated()) {
            const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
            cartnumber = cartResult.rows.length;

            const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
            wishnumber = wishlistResult.rows.length;
        }

        res.render("shop", {
            item: items,
            cn: cartnumber,
            wn: wishnumber,
            mn: mennumber,
             won:womennumber,
             kn:kidsnumber,
             fn:footwearnumber,
            isAuthenticated: req.isAuthenticated()
        });
    } catch (error) {
        console.error("Error fetching items:", error.message);
        res.render("shop", { 
            item: [],
            cn: 0,
            wn: 0,
            isAuthenticated: false,
            error: error.message 
        });
    }
})

app.get('/suggestions', async (req, res) => {
    const searchTerm = req.query.q;
    if (!searchTerm) {
        return res.json([]);
    }

    try {
        const result = await db.query(
            'SELECT name FROM items WHERE name ILIKE $1 LIMIT 10',
            [`%${searchTerm}%`]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching suggestions:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/searchitem", async (req, res) => {
    let searchproduct = req.body.searchinput;
    let cartnumber = 0;
    let wishnumber = 0;
  
    try {
      const check = await db.query("SELECT * FROM items WHERE name = $1", [searchproduct]);
  
      if (check.rows.length > 0) {
        res.render("product-description", {
          item: check.rows,
          cn: cartnumber,
          wn: wishnumber,
          isAuthenticated: req.isAuthenticated()
        });
      } else {
        res.render("error", {
          message: "Item not found",
          isAuthenticated: req.isAuthenticated()
        });
      }
    } catch (error) {
      res.status(500).render("error", {
        message: "Internal Server Error",
        isAuthenticated: req.isAuthenticated()
      });
    }
  });
  

app.post("/sortlowprice",async (req,res)=>{
const price=[];
const itemsResult = await db.query("SELECT * FROM items WHERE category =$1",[category]);
const items = itemsResult.rows;
function compareNumbers(a, b) {
    return a.price - b.price;
}
items.sort(compareNumbers);
let cartnumber = 0;
        let wishnumber = 0;
        if (req.isAuthenticated()) {
            const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
            cartnumber = cartResult.rows.length;

            const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
            wishnumber = wishlistResult.rows.length;
        }
res.render("product", {
    item: items,
    cn: cartnumber,
    wn: wishnumber,
    isAuthenticated: req.isAuthenticated()
});
})

app.post("/sorthighprice",async (req,res)=>{
    const price=[];
    const itemsResult = await db.query("SELECT * FROM items WHERE category =$1",[category]);
    const items = itemsResult.rows;
    function compareNumbers(a, b) {
        return b.price - a.price;
    }
    items.sort(compareNumbers);
    let cartnumber = 0;
            let wishnumber = 0;
            if (req.isAuthenticated()) {
                const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
                cartnumber = cartResult.rows.length;
    
                const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
                wishnumber = wishlistResult.rows.length;
            }
    res.render("product", {
        item: items,
        cn: cartnumber,
        wn: wishnumber,
        isAuthenticated: req.isAuthenticated()
    });
    })

app.post("/sortlowrating",async (req,res)=>{
    const price=[];
    const itemsResult = await db.query("SELECT * FROM items WHERE category =$1",[category]);
    const items = itemsResult.rows;
    function compareNumbers(a, b) {
        return a.rating - b.rating;
    }
    items.sort(compareNumbers);
    let cartnumber = 0;
            let wishnumber = 0;
            if (req.isAuthenticated()) {
                const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
                cartnumber = cartResult.rows.length;
    
                const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
                wishnumber = wishlistResult.rows.length;
            }
    res.render("product", {
        item: items,
        cn: cartnumber,
        wn: wishnumber,
        isAuthenticated: req.isAuthenticated()
    });
    })

    app.post("/sorthighrating",async (req,res)=>{
        const price=[];
        const itemsResult = await db.query("SELECT * FROM items WHERE category =$1",[category]);
        const items = itemsResult.rows;
        function compareNumbers(a, b) {
            return b.rating - a.rating;
        }
        items.sort(compareNumbers);
        let cartnumber = 0;
                let wishnumber = 0;
                if (req.isAuthenticated()) {
                    const cartResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [req.user.id]);
                    cartnumber = cartResult.rows.length;
        
                    const wishlistResult = await db.query("SELECT * FROM wishlist WHERE user_id = $1", [req.user.id]);
                    wishnumber = wishlistResult.rows.length;
                }
        res.render("product", {
            item: items,
            cn: cartnumber,
            wn: wishnumber,
            isAuthenticated: req.isAuthenticated()
        });
        })



// Existing imports and setup code...

// Routes...

app.post('/checkout', isAuthenticated, async (req, res) => {
    try {
        const user_id = req.user.id;

        // Fetch items from cart for the current user
        const cartItemsResult = await db.query("SELECT * FROM cart WHERE user_id = $1", [user_id]);
        const cartItems = cartItemsResult.rows;

        // Fetch all items related to the cart items
        const productIds = cartItems.map(item => item.product_id);
        const itemsResult = await db.query("SELECT * FROM items WHERE id = ANY($1::int[])", [productIds]);
        const items = itemsResult.rows;

        let sum=0;

        for(let i=0;i<items.length;i++)
        {
            sum=sum+items[i].price * cartItems[i].quantity;
        }

        // Update cart items with new size and quantity from the form
        for (let key in req.body) {
            if (key.startsWith('size_')) {
                let itemId = key.replace('size_', '');
                let size = req.body[key];
                let quantity = req.body[`quantity_${itemId}`];

                // Find the cart item corresponding to itemId
                const cartItem = cartItems.find(item => item.product_id.toString() === itemId);

                if (cartItem) {
                    // Update cart item with new size and quantity
                    await db.query("UPDATE cart SET size = $1, quantity = $2 WHERE id = $3", [size, quantity, cartItem.id]);
                } else {
                    console.error(`Cart item not found for product_id: ${itemId}`);
                }
            }
        }

        // Redirect or render confirmation page
        res.render("checkout.ejs", {
            cart: cartItems,
            item: items,
            total:sum
        });
    } catch (error) {
        console.error('Error processing checkout:', error.message);
        res.status(500).send('Error processing checkout. Please try again later.');
    }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});