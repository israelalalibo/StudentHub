import express from 'express'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from "cors";
import multer from "multer";
import fs from "fs";
//import Stripe from 'stripe';

dotenv.config()

// ============================================
// STRIPE CONFIGURATION
// ============================================
// IMPORTANT: Replace with your actual Stripe keys
// Use environment variables in production!
// const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_TEST_KEY_HERE';
// const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_YOUR_WEBHOOK_SECRET';
// const PLATFORM_FEE_PERCENT = 5; // Platform takes 5% of each sale

// // Initialize Stripe
// const stripe = new Stripe(STRIPE_SECRET_KEY);

// Supabase configuration
const supabaseUrl = 'https://bfpaawywaljnfudynnke.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmcGFhd3l3YWxqbmZ1ZHlubmtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODU1NTAxOCwiZXhwIjoyMDc0MTMxMDE4fQ.B5ubNYjTV4j5N4aXsIpepYBOBPbEAx0n1vRmFPkroMo';

// TWO SEPARATE CLIENTS:
// 1. supabaseAuth - ONLY for authentication (signIn, signOut, getUser)
// 2. supabaseAdmin - ONLY for data queries (select, insert, update, delete)
// This prevents auth operations from polluting the data client's state

const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Legacy alias for backward compatibility (maps to auth client)
const supabase = supabaseAuth;
const app = express();

app.use(cors()); //Allow frontend to communicate with backend securely during local or deployed testing
app.use(express.json());

//const __filename = fileURLToPath(import.meta.url)
const __dirname = path.resolve();

// Serve everything inside "public" folder
app.use(express.static(path.join(__dirname, "public")));


app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/landingpage', (req, res) => {
  res.sendFile(path.join(__dirname, 'landingPage.html'));
});

//Get the Logged in user ID
//const user = await supabase.auth.getUser();
// let loggedin_user_id; // = user.id;

//handle signin request
app.post("/signin", async (req, res) => {
  const {email, password} = req.body;
  console.log("Login attempt for:", email);

  try {
    const { data, error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signinError) {
      console.error("Sign in error:", signinError.message);
      return res.status(400).json({ error: signinError.message });
    }

    // Ensure session is properly set and wait for it
    if (data.session) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
      
      if (setSessionError) {
        console.error("Set session error:", setSessionError.message);
      }
      
      // Verify the session is active by getting the user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Get user after login error:", userError.message);
      } else {
        console.log("Session verified for user:", userData.user?.id);
      }
    }

    console.log("User logged in successfully:", data.user.id);
    
    res.status(200).json({
      message: "Signin successful",
      redirect: "../views/landingpage.html",
      userID: data.user.id,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token
      }
    });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Handle signup request
app.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, phone, createdAt } = req.body;
  console.log(req.body);

  try {
    // 1. Create user in Supabase Auth
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm, or set false if you want email verification
    });

    if (authError) {
      console.error("Auth error:", authError.message);
      return res.status(400).json({ error: authError.message });
    }

    const user = userData.user;

    // 2. Insert into Student table (use supabaseAdmin for data operations)
    const { error: insertError } = await supabaseAdmin.from("student").insert([
      {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        created_at : createdAt,
      },
    ]);

    if (insertError) {
      return res.status(400).json({ error: insertError.message });
    }

    res.json({ message: "User created successfully", userID: user.id });

  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/logout', async (req, res) =>{
  try {
    // Use 'local' scope to only clear the current session without affecting the service_role client
    // This prevents corrupting the Supabase client used for data queries
    const { error: logOutError } = await supabase.auth.signOut({ scope: 'local' });

    if (logOutError) {
      console.error("Auth error:", logOutError.message);
      // Continue anyway - client will clear local storage
    }

    console.log("User logged out successfully");

    res.status(200).json({
      message: "Logout successful",
      redirect: "../index",
    });
  } catch (err) {
    console.error("Logout error:", err);
    // Still return success - client should clear local session
    res.status(200).json({ 
      message: "Logout completed",
      redirect: "../index" 
    });
  }
});

// Change password endpoint
app.post('/api/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      console.error("Password update error:", updateError.message);
      return res.status(400).json({ error: updateError.message });
    }

    console.log("Password updated for user:", user.id);
    res.json({ success: true, message: "Password updated successfully" });

  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Helper endpoint to refresh/verify the current session
app.get('/api/session', async (req, res) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return res.status(401).json({ authenticated: false, error: "No active session" });
    }

    // Refresh the session if it exists
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return res.status(401).json({ authenticated: false, error: "Session expired" });
    }

    res.json({ 
      authenticated: true, 
      userId: user.id,
      email: user.email
    });
  } catch (err) {
    console.error("Session check error:", err);
    res.status(500).json({ authenticated: false, error: err.message });
  }
});

// Endpoint to restore session from client tokens
app.post('/api/restore-session', async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;
    
    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: "Tokens required" });
    }

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({ success: true, userId: data.user?.id });
  } catch (err) {
    console.error("Restore session error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* Book Valuator Logic */
const GOOGLE_API_KEY = "AIzaSyCIFuQZQQ27r1mlPo6ynPCoeTbnppqyDlQ";

async function getBookInfoFromISBN(isbn) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const volume = data.items[0].volumeInfo;
      return {
        title: volume.title,
        authors: volume.authors || [],
        publishedDate: volume.publishedDate || "Unknown"
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching book info:", err);
    return null;
  }
}

app.post('/bookValuator', async (req, res) => {
  try{
    const bookData = req.body;

    //Fetch Book title and Author using ISBN
    const bookInfo = await getBookInfoFromISBN(bookData.isbn)

    const titlePart = bookInfo
    ? `The book is "${bookInfo.title}" by ${bookInfo.authors.join(", ")}.`
    : "The book title could not be found via ISBN lookup.";


    if (!bookData || !bookData.isbn) {
      return res.status(400).json({ error: "Invalid book data provided." });
    }

    const SYSTEM_PROMPT = `
    You are an expert used book appraiser. Your task is to predict the market value of a used book based on its attributes.

    Respond only in clean JSON format:
    {
      "predicted_value": <number>,
      "reasoning": "<short explanation>"
    }

    Guidelines:
    - Start from an estimated new price.
    - 'Like New' retains most value; 'Acceptable' the least.
    - Hardcovers > paperbacks.
    - First editions and signed copies are more valuable.
    - Each damage decreases value.
    - Major defects (like a broken spine) greatly reduce it.
    -All values are in pounds.

    ${titlePart}
    When explaining, explicitly mention the book’s title (if available) and how its specific attributes affect the valuation.
        `;

    //Build user query text
    const userQuery = `
    Appraise this book based on the following data:
    ${JSON.stringify(bookData, null, 2)}`;

    //console.log(userQuery);

    //Build the Payload for the Google API
    const payload = {
      contents: [{parts: [{text: userQuery}] }],
      systemInstruction: {
        parts: [{text: SYSTEM_PROMPT }]
      },
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    //call Google Gemini API
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GOOGLE_API_KEY;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google API error:", errText);
      return res.status(500).json({ error: "Failed to fetch from Google API" });
    }

    //Parse model output
    const data = await response.json();
    let modelResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    //Ensure it’s valid JSON
    let result;
    try {
      result = JSON.parse(modelResponse);
    } catch {
      result = {
        predicted_value: null,
        reasoning: modelResponse || "Model returned an unexpected response."
      };
    }

    //Send back clean result
    res.status(200).json({
      success: true,
      predicted_value: result.predicted_value,
      reasoning: result.reasoning
    });
  } catch (err){
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
  console.log(req.body);
});

const upload = multer({dest: "/uploads"});

// Multer config for profile pictures (memory storage for Supabase upload)
const profilePictureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

app.post("/uploadProduct", upload.single("image"), async (req, res) => {
  try {
    const { title, description, price, category, condition/*seller_id */ } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: "Image file missing" });
    }

    //get the seller ID
    const { data: { user } } = await supabase.auth.getUser();
    const seller_id = user.id;
    console.log(user.id);
    
    //Upload image to Supabase Storage
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${seller_id}_${Date.now()}.${fileExt}`;
    const fileBuffer = fs.readFileSync(file.path);
    const filePath = `${seller_id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false
      });

    // Delete temporary file
    fs.unlinkSync(file.path);

    if (uploadError) throw uploadError;

    // Get public URL for the uploaded image
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    console.log(imageUrl); //testing
    console.log(seller_id);

    //Insert into Supabase database (use supabaseAdmin for data operations)
    const { error: insertError } = await supabaseAdmin.from("ProductTable").insert([
      {
        title,
        description,
        price: parseFloat(price),
        category,
        image_url: imageUrl,
        seller_id,
        condition
      }
    ]);

    if (insertError) throw insertError;

    res.status(200).json({ success: true, message: "Product uploaded successfully" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ FEATURED PRODUCTS API ============
// Get featured products prioritized by review count
app.get("/api/featured-products", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    // Get all products with seller info
    const { data: products, error: productsError } = await supabaseAdmin
      .from("ProductTable")
      .select(`
        *,
        student:seller_id (first_name, last_name)
      `)
      .order("created_at", { ascending: false });

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      return res.json([]);
    }

    // Get review counts for all products
    const { data: reviewCounts, error: reviewsError } = await supabaseAdmin
      .from("reviews")
      .select("product_id");

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
    }

    // Count reviews per product
    const reviewCountMap = {};
    if (reviewCounts) {
      reviewCounts.forEach(review => {
        const pid = review.product_id;
        reviewCountMap[pid] = (reviewCountMap[pid] || 0) + 1;
      });
    }

    // Add review count to each product and format seller name
    const productsWithReviews = products.map(product => ({
      ...product,
      review_count: reviewCountMap[product.product_id] || 0,
      seller_name: product.student 
        ? `${product.student.first_name || ''} ${product.student.last_name || ''}`.trim() 
        : 'Student'
    }));

    // Sort by review count (descending), then by created_at (descending)
    productsWithReviews.sort((a, b) => {
      if (b.review_count !== a.review_count) {
        return b.review_count - a.review_count;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // Return top featured products
    const featured = productsWithReviews.slice(0, limit);
    
    console.log(`Returning ${featured.length} featured products`);
    res.json(featured);

  } catch (err) {
    console.error("Featured products error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/search", async (req, res) => {
  const query = req.query.query || "";
  const priceFilter = req.query.price || "";
  console.log("Search query received:", query, "Price filter:", priceFilter);
  
  try {
    // Build the query
    let searchQuery = supabaseAdmin
      .from("ProductTable")
      .select("*")
      .ilike("title", `%${query}%`);

    // Apply price filter
    if (priceFilter) {
      if (priceFilter === "0-25") {
        searchQuery = searchQuery.gte("price", 0).lte("price", 25);
      } else if (priceFilter === "25-50") {
        searchQuery = searchQuery.gte("price", 25).lte("price", 50);
      } else if (priceFilter === "50-100") {
        searchQuery = searchQuery.gte("price", 50).lte("price", 100);
      } else if (priceFilter === "100-200") {
        searchQuery = searchQuery.gte("price", 100).lte("price", 200);
      } else if (priceFilter === "200+") {
        searchQuery = searchQuery.gte("price", 200);
      }
    }

    const { data, error } = await searchQuery;

    if (error) {
      console.error("Search error:", error);
      throw error;
    }

    console.log("Search results count:", data?.length || 0);

    if (!data || data.length === 0) {
      // Try to get all products to see if any exist
      const { data: allProducts, error: allError } = await supabaseAdmin
        .from("ProductTable")
        .select("title")
        .limit(5);
      
      console.log("All products sample:", allProducts);
      if (allError) console.error("All products error:", allError);
    }

    // Now get seller info separately if we have results
    const results = await Promise.all((data || []).map(async (p) => {
      let sellerInfo = { first_name: 'Unknown Seller', last_name: null };
      
      if (p.seller_id) {
        const { data: seller } = await supabaseAdmin
          .from("student")
          .select("first_name, last_name, created_at")
          .eq("id", p.seller_id)
          .maybeSingle();
        
        if (seller) {
          sellerInfo = seller;
        }
      }
      
      return {
        ...p,
        first_name: sellerInfo.first_name || 'Unknown Seller',
        last_name: sellerInfo.last_name || null,
        seller: `${sellerInfo.first_name || 'Unknown'} ${sellerInfo.last_name || ''}`.trim()
      };
    }));

    console.log("Final results:", results.length);
    res.json(results);
   
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Error fetching search results", error: err.message });
  }
})

// Category search endpoint - filter products by category
app.get("/search/category", async (req, res) => {
  const category = req.query.category || "";
  const priceFilter = req.query.price || "";
  console.log("Category search for:", category, "Price filter:", priceFilter);
  
  try {
    // Build the query
    let searchQuery = supabaseAdmin
      .from("ProductTable")
      .select("*")
      .ilike("category", category);

    // Apply price filter
    if (priceFilter) {
      if (priceFilter === "0-25") {
        searchQuery = searchQuery.gte("price", 0).lte("price", 25);
      } else if (priceFilter === "25-50") {
        searchQuery = searchQuery.gte("price", 25).lte("price", 50);
      } else if (priceFilter === "50-100") {
        searchQuery = searchQuery.gte("price", 50).lte("price", 100);
      } else if (priceFilter === "100-200") {
        searchQuery = searchQuery.gte("price", 100).lte("price", 200);
      } else if (priceFilter === "200+") {
        searchQuery = searchQuery.gte("price", 200);
      }
    }

    const { data, error } = await searchQuery;

    if (error) {
      console.error("Category search error:", error);
      throw error;
    }

    console.log("Category results count:", data?.length || 0);

    // Get seller info separately
    const results = await Promise.all((data || []).map(async (p) => {
      let sellerInfo = { first_name: 'Unknown Seller', last_name: null };
      
      if (p.seller_id) {
        const { data: seller } = await supabaseAdmin
          .from("student")
          .select("first_name, last_name, created_at")
          .eq("id", p.seller_id)
          .maybeSingle();
        
        if (seller) {
          sellerInfo = seller;
        }
      }
      
      return {
        ...p,
        seller: `${sellerInfo.first_name || 'Unknown'} ${sellerInfo.last_name || ''}`.trim(),
        first_name: sellerInfo.first_name || 'Unknown Seller',
        last_name: sellerInfo.last_name || null
      };
    }));

    console.log(`Category "${category}": ${results.length} items found`);
    res.json(results);

  } catch (err) {
    console.error("Category search error:", err);
    res.status(500).json({ message: "Error fetching category results", error: err.message });
  }
})

// Debug endpoint - check if products exist in database
app.get("/api/debug/products", async (req, res) => {
  try {
    // Use supabaseAdmin for data queries
    const { data, error, count } = await supabaseAdmin
      .from("ProductTable")
      .select("*", { count: "exact" })
      .limit(10);

    if (error) {
      console.error("Debug products error:", error);
      return res.status(500).json({ error: error.message, hint: error.hint });
    }

    res.json({
      total_count: count,
      sample_products: data,
      message: count > 0 ? "Products found in database" : "No products in database - try adding some products first"
    });
  } catch (err) {
    console.error("Debug error:", err);
    res.status(500).json({ error: err.message });
  }
})

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/profile.html'))
})

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/settings.html'))
})

// ============ REVIEWS API ============

// Add a review for a product
app.post("/reviews", async (req, res) => {
  try {
    const { product_id, rating, review_text, product_title } = req.body;

    // Get the logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "You must be logged in to write a review" });
    }

    // Get user's name from student table (use supabaseAdmin for data queries)
    const { data: studentData } = await supabaseAdmin
      .from("student")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    const reviewer_name = studentData 
      ? `${studentData.first_name} ${studentData.last_name || ''}`.trim() 
      : 'Anonymous';

    // Insert review (use supabaseAdmin for data operations)
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .insert([{
        product_id,
        product_title,
        user_id: user.id,
        reviewer_name,
        rating: parseInt(rating),
        review_text,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    res.status(201).json({ success: true, review: data[0] });
  } catch (err) {
    console.error("Review error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get reviews for a specific product
app.get("/reviews/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    // Use supabaseAdmin for data queries
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get reviews by the logged-in user
app.get("/reviews/user", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Use supabaseAdmin for data queries
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error("Get user reviews error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ PROFILE API ============

// Get current user's profile data with stats
app.get("/api/profile", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Get student info (use maybeSingle to handle case where no record exists)
    // Use supabaseAdmin for data queries
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from("student")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // Only throw if it's a real error, not just "no rows found"
    if (studentError && studentError.code !== 'PGRST116') {
      console.error("Student fetch error:", studentError);
    }

    // Get items listed count
    const { count: itemsCount } = await supabaseAdmin
      .from("ProductTable")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", user.id);

    // Get reviews count
    const { count: reviewsCount } = await supabaseAdmin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    res.json({
      id: user.id,
      email: user.email,
      first_name: studentData?.first_name || '',
      last_name: studentData?.last_name || '',
      phone: studentData?.phone || '',
      profile_picture: studentData?.profile_picture || null,
      created_at: studentData?.created_at || user.created_at,
      items_listed: itemsCount || 0,
      reviews_written: reviewsCount || 0
    });

  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update user profile (first name, last name)
app.post("/api/profile/update", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { first_name, last_name } = req.body;

    // Check if student record exists (use supabaseAdmin for data queries)
    const { data: existing } = await supabaseAdmin
      .from("student")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabaseAdmin
        .from("student")
        .update({
          first_name: first_name || null,
          last_name: last_name || null
        })
        .eq("id", user.id);

      if (updateError) throw updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabaseAdmin
        .from("student")
        .insert([{
          id: user.id,
          first_name: first_name || null,
          last_name: last_name || null,
          created_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;
    }

    console.log("Profile updated for user:", user.id);
    res.json({ success: true, message: "Profile updated successfully" });

  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ CART API (User-specific) ============

// Get cart items for logged-in user
app.get("/api/cart", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in", items: [] });
    }

    // Use supabaseAdmin for data queries
    const { data, error } = await supabaseAdmin
      .from("cart")
      .select("*")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (error) throw error;

    res.json({ items: data || [] });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ error: err.message, items: [] });
  }
});

// Add item to cart
app.post("/api/cart", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "You must be logged in to add items to cart" });
    }

    const { product_id, title, price, image_url, category, condition, seller_id, seller_name } = req.body;

    // Check if item already exists in cart (use supabaseAdmin)
    const { data: existing } = await supabaseAdmin
      .from("cart")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (existing) {
      // Update quantity
      const { data, error } = await supabaseAdmin
        .from("cart")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return res.json({ success: true, item: data, message: "Quantity updated" });
    }

    // Insert new cart item
    const { data, error } = await supabaseAdmin
      .from("cart")
      .insert([{
        user_id: user.id,
        product_id: product_id || `${seller_id}_${title}`,
        title,
        price: parseFloat(price) || 0,
        image_url,
        category,
        condition,
        seller_id,
        seller_name,
        quantity: 1,
        added_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, item: data });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update cart item quantity
app.patch("/api/cart/:itemId", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      // Delete item if quantity is 0 or less
      const { error } = await supabaseAdmin
        .from("cart")
        .delete()
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;
      return res.json({ success: true, deleted: true });
    }

    const { data, error } = await supabaseAdmin
      .from("cart")
      .update({ quantity })
      .eq("id", itemId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, item: data });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Remove item from cart
app.delete("/api/cart/:itemId", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { itemId } = req.params;

    const { error } = await supabaseAdmin
      .from("cart")
      .delete()
      .eq("id", itemId)
      .eq("user_id", user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Clear entire cart for user
app.delete("/api/cart", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { error } = await supabaseAdmin
      .from("cart")
      .delete()
      .eq("user_id", user.id);

    if (error) throw error;

    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get cart count (for badge)
app.get("/api/cart/count", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.json({ count: 0 });
    }

    const { data, error } = await supabaseAdmin
      .from("cart")
      .select("quantity")
      .eq("user_id", user.id);

    if (error) throw error;

    const count = (data || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
    res.json({ count });
  } catch (err) {
    console.error("Cart count error:", err);
    res.json({ count: 0 });
  }
});

// ============ MESSAGING API ============

// Get all conversations for the logged-in user
app.get("/api/conversations", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Get conversations where user is either buyer or seller
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Enrich with participant info
    const enrichedConversations = await Promise.all((data || []).map(async (conv) => {
      const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
      
      // Get other user's info including profile picture
      const { data: otherUser } = await supabaseAdmin
        .from("student")
        .select("first_name, last_name, profile_picture")
        .eq("id", otherUserId)
        .maybeSingle();

      // Get last message
      const { data: lastMsg } = await supabaseAdmin
        .from("messages")
        .select("content, created_at, sender_id")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get unread count
      const { count: unreadCount } = await supabaseAdmin
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      return {
        ...conv,
        other_user_name: otherUser 
          ? `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim() || 'Unknown User'
          : 'Unknown User',
        other_user_id: otherUserId,
        other_user_picture: otherUser?.profile_picture || null,
        last_message: lastMsg?.content || null,
        last_message_time: lastMsg?.created_at || conv.updated_at,
        last_message_is_mine: lastMsg?.sender_id === user.id,
        unread_count: unreadCount || 0
      };
    }));

    res.json(enrichedConversations);
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get or create a conversation with a seller
app.post("/api/conversations", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { seller_id, product_id, product_title } = req.body;

    if (!seller_id) {
      return res.status(400).json({ error: "Seller ID is required" });
    }

    // Don't allow messaging yourself
    if (seller_id === user.id) {
      return res.status(400).json({ error: "You cannot message yourself" });
    }

    // Check if conversation already exists
    const { data: existing } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("buyer_id", user.id)
      .eq("seller_id", seller_id)
      .maybeSingle();

    if (existing) {
      return res.json({ conversation: existing, isNew: false });
    }

    // Create new conversation
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .insert([{
        buyer_id: user.id,
        seller_id: seller_id,
        product_id: product_id || null,
        product_title: product_title || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ conversation: data, isNew: true });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get messages for a specific conversation
app.get("/api/messages/:conversationId", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { conversationId } = req.params;

    // Verify user is part of this conversation
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    if (!conv || (conv.buyer_id !== user.id && conv.seller_id !== user.id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get both users' info including profile pictures
    const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
    
    const { data: currentUserInfo } = await supabaseAdmin
      .from("student")
      .select("first_name, last_name, profile_picture")
      .eq("id", user.id)
      .maybeSingle();

    const { data: otherUserInfo } = await supabaseAdmin
      .from("student")
      .select("first_name, last_name, profile_picture")
      .eq("id", otherUserId)
      .maybeSingle();

    // Get messages
    const { data, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Mark messages as read (messages not sent by me)
    await supabaseAdmin
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id);

    res.json({
      messages: data || [],
      conversation: conv,
      current_user_id: user.id,
      current_user_name: currentUserInfo 
        ? `${currentUserInfo.first_name || ''} ${currentUserInfo.last_name || ''}`.trim() || 'You'
        : 'You',
      current_user_picture: currentUserInfo?.profile_picture || null,
      other_user_id: otherUserId,
      other_user_name: otherUserInfo 
        ? `${otherUserInfo.first_name || ''} ${otherUserInfo.last_name || ''}`.trim() || 'Unknown User'
        : 'Unknown User',
      other_user_picture: otherUserInfo?.profile_picture || null
    });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Send a new message
app.post("/api/messages", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { conversation_id, content } = req.body;

    if (!conversation_id || !content?.trim()) {
      return res.status(400).json({ error: "Conversation ID and message content are required" });
    }

    // Verify user is part of this conversation
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversation_id)
      .maybeSingle();

    if (!conv || (conv.buyer_id !== user.id && conv.seller_id !== user.id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Insert message
    const { data, error } = await supabaseAdmin
      .from("messages")
      .insert([{
        conversation_id,
        sender_id: user.id,
        content: content.trim(),
        is_read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Update conversation's updated_at
    await supabaseAdmin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation_id);

    res.status(201).json({ message: data });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get unread message count for badge
app.get("/api/messages/unread/count", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.json({ count: 0 });
    }

    // Get all conversations user is part of
    const { data: conversations } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    if (!conversations || conversations.length === 0) {
      return res.json({ count: 0 });
    }

    const convIds = conversations.map(c => c.id);

    // Count unread messages not sent by me
    const { count } = await supabaseAdmin
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    res.json({ count: count || 0 });
  } catch (err) {
    console.error("Unread count error:", err);
    res.json({ count: 0 });
  }
});

// ============ PURCHASES API ============

// Create a new purchase (checkout from cart)
app.post("/api/purchases", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Get cart items
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from("cart")
      .select("*")
      .eq("user_id", user.id);

    if (cartError) throw cartError;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabaseAdmin
      .from("purchases")
      .insert([{
        user_id: user.id,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'completed',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    // Create purchase items
    const purchaseItems = cartItems.map(item => ({
      purchase_id: purchase.id,
      product_id: item.product_id,
      title: item.title,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
      category: item.category,
      condition: item.condition,
      seller_id: item.seller_id,
      seller_name: item.seller_name
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("purchase_items")
      .insert(purchaseItems);

    if (itemsError) throw itemsError;

    // Clear the cart
    await supabaseAdmin
      .from("cart")
      .delete()
      .eq("user_id", user.id);

    console.log("Purchase completed:", purchase.id);
    res.status(201).json({ 
      success: true, 
      purchase: purchase,
      message: "Purchase completed successfully!" 
    });

  } catch (err) {
    console.error("Purchase error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all purchases for the logged-in user
app.get("/api/purchases", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Get purchases with their items
    const { data: purchases, error } = await supabaseAdmin
      .from("purchases")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get items for each purchase
    const purchasesWithItems = await Promise.all((purchases || []).map(async (purchase) => {
      const { data: items } = await supabaseAdmin
        .from("purchase_items")
        .select("*")
        .eq("purchase_id", purchase.id);

      return {
        ...purchase,
        items: items || []
      };
    }));

    res.json(purchasesWithItems);

  } catch (err) {
    console.error("Get purchases error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single purchase by ID
app.get("/api/purchases/:purchaseId", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { purchaseId } = req.params;

    // Get purchase
    const { data: purchase, error } = await supabaseAdmin
      .from("purchases")
      .select("*")
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // Get items
    const { data: items } = await supabaseAdmin
      .from("purchase_items")
      .select("*")
      .eq("purchase_id", purchaseId);

    res.json({
      ...purchase,
      items: items || []
    });

  } catch (err) {
    console.error("Get purchase error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get purchase statistics for user
app.get("/api/purchases/stats/summary", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Get all purchases
    const { data: purchases } = await supabaseAdmin
      .from("purchases")
      .select("total, created_at")
      .eq("user_id", user.id);

    const totalSpent = (purchases || []).reduce((sum, p) => sum + (p.total || 0), 0);
    const totalOrders = (purchases || []).length;

    // Get total items purchased
    const { count: totalItems } = await supabaseAdmin
      .from("purchase_items")
      .select("*", { count: "exact", head: true })
      .in("purchase_id", (purchases || []).map(p => p.id));

    res.json({
      total_spent: totalSpent,
      total_orders: totalOrders,
      total_items: totalItems || 0
    });

  } catch (err) {
    console.error("Purchase stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ MY LISTINGS API ============

// Get all listings for the logged-in user
app.get("/api/my-listings", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { data, error } = await supabaseAdmin
      .from("ProductTable")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);

  } catch (err) {
    console.error("Get listings error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get listing statistics for user
app.get("/api/my-listings/stats", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Get all listings
    const { data: listings } = await supabaseAdmin
      .from("ProductTable")
      .select("price, created_at")
      .eq("seller_id", user.id);

    const totalListings = (listings || []).length;
    const totalValue = (listings || []).reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    // Count active (we consider all as active for now)
    const activeListings = totalListings;

    res.json({
      total_listings: totalListings,
      active_listings: activeListings,
      total_value: totalValue
    });

  } catch (err) {
    console.error("Listing stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update a listing
app.patch("/api/my-listings/:listingId", upload.array("images", 5), async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { listingId } = req.params;
    const { title, description, price, category, condition } = req.body;
    const files = req.files || [];

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("ProductTable")
      .select("seller_id, image_url")
      .eq("product_id", listingId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching listing:", fetchError);
      throw fetchError;
    }

    if (!existing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Compare as strings to avoid type mismatch
    if (String(existing.seller_id) !== String(user.id)) {
      return res.status(403).json({ error: "You can only edit your own listings" });
    }

    // Prepare update data
    let updateData = {
      title: title,
      description: description,
      price: parseFloat(price),
      category: category,
      condition: condition,
      updated_at: new Date().toISOString()
    };

    // Handle image uploads if any new images were provided
    if (files.length > 0) {
      // Upload the first image as the main image (can extend to multiple images later)
      const file = files[0];
      const fileExt = file.originalname.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const fileBuffer = fs.readFileSync(file.path);
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: false
        });

      // Delete temporary files
      files.forEach(f => {
        try {
          fs.unlinkSync(f.path);
        } catch (e) {
          console.error("Error deleting temp file:", e);
        }
      });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      updateData.image_url = urlData.publicUrl;

      // Optionally delete old image from storage (if it exists and is different)
      if (existing.image_url && existing.image_url !== updateData.image_url) {
        try {
          // Extract path from URL
          const oldPath = existing.image_url.split('/product-images/')[1];
          if (oldPath) {
            await supabase.storage.from("product-images").remove([oldPath]);
          }
        } catch (e) {
          console.error("Error deleting old image:", e);
          // Don't fail the update if old image deletion fails
        }
      }
    }

    // Update the listing
    const { data, error } = await supabaseAdmin
      .from("ProductTable")
      .update(updateData)
      .eq("product_id", listingId)
      .select()
      .single();

    if (error) throw error;

    console.log("Listing updated:", listingId);
    res.json({ success: true, listing: data });

  } catch (err) {
    console.error("Update listing error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a listing
app.delete("/api/my-listings/:listingId", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { listingId } = req.params;
    console.log("Delete request for listing:", listingId, "by user:", user.id);

    // Verify ownership - try to find the listing first
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("ProductTable")
      .select("*")
      .eq("product_id", listingId)
      .maybeSingle();

    console.log("Existing listing found:", existing);
    console.log("Fetch error:", fetchError);

    if (fetchError) {
      console.error("Error fetching listing:", fetchError);
      throw fetchError;
    }

    if (!existing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Compare as strings to avoid type mismatch issues
    const listingSellerId = String(existing.seller_id);
    const currentUserId = String(user.id);
    
    console.log("Listing seller_id:", listingSellerId);
    console.log("Current user_id:", currentUserId);
    console.log("Match:", listingSellerId === currentUserId);

    if (listingSellerId !== currentUserId) {
      return res.status(403).json({ error: "You can only delete your own listings" });
    }

    // Delete from database
    const { error } = await supabaseAdmin
      .from("ProductTable")
      .delete()
      .eq("product_id", listingId);

    if (error) throw error;

    console.log("Listing deleted successfully:", listingId);
    res.json({ success: true, message: "Listing deleted successfully" });

  } catch (err) {
    console.error("Delete listing error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ PROFILE PICTURE API ============

// Upload profile picture
app.post("/api/profile/picture", profilePictureUpload.single("profileImage"), async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Check if file was uploaded via multer
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({ error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" });
    }

    // Create unique filename
    const fileName = `profile_${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    // Delete old profile picture if exists
    const { data: existingStudent } = await supabaseAdmin
      .from("student")
      .select("profile_picture")
      .eq("id", user.id)
      .maybeSingle();

    if (existingStudent?.profile_picture) {
      // Try to delete old file from storage
      await supabase.storage
        .from("profile-pictures")
        .remove([existingStudent.profile_picture.replace('profile-pictures/', '')]);
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update student record with profile picture URL
    const { data: existingRecord } = await supabaseAdmin
      .from("student")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingRecord) {
      await supabaseAdmin
        .from("student")
        .update({ profile_picture: publicUrl })
        .eq("id", user.id);
    } else {
      await supabaseAdmin
        .from("student")
        .insert([{
          id: user.id,
          profile_picture: publicUrl,
          created_at: new Date().toISOString()
        }]);
    }

    console.log("Profile picture uploaded for user:", user.id);
    res.json({ 
      success: true, 
      profile_picture: publicUrl,
      message: "Profile picture uploaded successfully" 
    });

  } catch (err) {
    console.error("Profile picture upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete profile picture
app.delete("/api/profile/picture", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // Get current profile picture
    const { data: student } = await supabaseAdmin
      .from("student")
      .select("profile_picture")
      .eq("id", user.id)
      .maybeSingle();

    if (student?.profile_picture) {
      // Extract filename from URL
      const urlParts = student.profile_picture.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      await supabase.storage
        .from("profile-pictures")
        .remove([fileName]);

      // Update database
      await supabaseAdmin
        .from("student")
        .update({ profile_picture: null })
        .eq("id", user.id);
    }

    console.log("Profile picture deleted for user:", user.id);
    res.json({ success: true, message: "Profile picture deleted" });

  } catch (err) {
    console.error("Delete profile picture error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Get user's balance and earnings
app.get("/api/balance", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { data, error } = await supabaseAdmin
      .from("student")
      .select("balance, total_earnings")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;

    res.json({
      balance: data?.balance || 0,
      total_earnings: data?.total_earnings || 0
    });

  } catch (err) {
    console.error("Balance fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create Stripe Checkout Session
app.post("/api/checkout/create-session", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Please log in to checkout" });
    }

    const { cartItems } = req.body;
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Get user email
    const { data: studentData } = await supabaseAdmin
      .from("student")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    // Calculate totals
    let subtotal = 0;
    const lineItems = [];
    const orderItems = [];

    for (const item of cartItems) {
      // Verify product exists and get current price
      const { data: product, error: productError } = await supabaseAdmin
        .from("ProductTable")
        .select("*, student:seller_id(first_name, last_name)")
        .eq("product_id", item.product_id)
        .maybeSingle();

      if (productError || !product) {
        return res.status(400).json({ error: `Product not found: ${item.title}` });
      }

      // Can't buy your own product
      if (product.seller_id === user.id) {
        return res.status(400).json({ error: `You cannot buy your own product: ${product.title}` });
      }

      const price = parseFloat(product.price);
      const quantity = item.quantity || 1;
      const itemTotal = price * quantity;
      subtotal += itemTotal;

      // Calculate seller amount (price minus platform fee)
      const platformFee = (price * PLATFORM_FEE_PERCENT) / 100;
      const sellerAmount = price - platformFee;

      // Add to line items for Stripe
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            description: `${product.condition || 'Good'} - Sold by ${product.student?.first_name || 'Student'}`,
            images: product.image_url ? [product.image_url] : [],
          },
          unit_amount: Math.round(price * 100), // Stripe uses cents
        },
        quantity: quantity,
      });

      // Store order item info
      orderItems.push({
        product_id: product.product_id,
        seller_id: product.seller_id,
        title: product.title,
        price: price,
        quantity: quantity,
        seller_amount: sellerAmount,
      });
    }

    // Calculate platform fee and total
    const totalPlatformFee = (subtotal * PLATFORM_FEE_PERCENT) / 100;
    const totalAmount = subtotal;

    // Create order in database (pending status)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: user.id,
        subtotal: subtotal,
        platform_fee: totalPlatformFee,
        total_amount: totalAmount,
        status: 'pending',
        payment_status: 'unpaid',
        buyer_email: user.email,
        buyer_name: studentData ? `${studentData.first_name} ${studentData.last_name}` : user.email,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw orderError;
    }

    // Create order items
    for (const item of orderItems) {
      await supabaseAdmin
        .from("order_items")
        .insert({
          order_id: order.order_id,
          product_id: item.product_id,
          seller_id: item.seller_id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          seller_amount: item.seller_amount,
        });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:3000'}/views/order-success.html?session_id={CHECKOUT_SESSION_ID}&order_id=${order.order_id}`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/views/cart.html?cancelled=true`,
      customer_email: user.email,
      metadata: {
        order_id: order.order_id,
        buyer_id: user.id,
      },
    });

    // Update order with Stripe session ID
    await supabaseAdmin
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("order_id", order.order_id);

    console.log("Checkout session created:", session.id);
    res.json({ 
      sessionId: session.id, 
      url: session.url,
      orderId: order.order_id 
    });

  } catch (err) {
    console.error("Checkout session error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify payment and complete order
app.post("/api/checkout/verify-payment", async (req, res) => {
  try {
    const { sessionId, orderId } = req.body;

    if (!sessionId || !orderId) {
      return res.status(400).json({ error: "Session ID and Order ID required" });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: "Payment not completed",
        status: session.payment_status 
      });
    }

    // Update order status
    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .update({
        status: 'paid',
        payment_status: 'paid',
        stripe_payment_intent_id: session.payment_intent,
        paid_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (orderError) throw orderError;

    // Get order items and credit sellers
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) throw itemsError;

    // Credit each seller's balance
    for (const item of orderItems) {
      // Update seller balance
      const { error: balanceError } = await supabaseAdmin
        .rpc('increment_balance', { 
          user_id: item.seller_id, 
          amount: item.seller_amount 
        });

      // If RPC doesn't exist, do it manually
      if (balanceError) {
        const { data: seller } = await supabaseAdmin
          .from("student")
          .select("balance, total_earnings")
          .eq("id", item.seller_id)
          .single();

        await supabaseAdmin
          .from("student")
          .update({
            balance: (seller?.balance || 0) + item.seller_amount,
            total_earnings: (seller?.total_earnings || 0) + item.seller_amount,
          })
          .eq("id", item.seller_id);
      }

      // Mark item as paid to seller
      await supabaseAdmin
        .from("order_items")
        .update({ 
          seller_paid: true, 
          seller_paid_at: new Date().toISOString() 
        })
        .eq("order_item_id", item.order_item_id);

      // Create transaction record
      await supabaseAdmin
        .from("transactions")
        .insert({
          user_id: item.seller_id,
          type: 'payment',
          amount: item.seller_amount,
          order_id: orderId,
          order_item_id: item.order_item_id,
          stripe_reference: session.payment_intent,
          description: `Sale: ${item.title}`,
          status: 'completed',
        });
    }

    // Clear buyer's cart
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabaseAdmin
        .from("cart")
        .delete()
        .eq("user_id", user.id);
    }

    // Create purchase records for buyer
    for (const item of orderItems) {
      await supabaseAdmin
        .from("purchases")
        .insert({
          user_id: session.metadata.buyer_id,
          product_id: item.product_id,
          product_title: item.title,
          price: item.price,
          quantity: item.quantity,
          order_id: orderId,
        });
    }

    console.log("Payment verified and sellers credited for order:", orderId);
    res.json({ 
      success: true, 
      message: "Payment verified and order completed",
      orderId: orderId
    });

  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get order details
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { orderId } = req.params;

    // Get order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .eq("buyer_id", user.id)
      .single();

    if (orderError) throw orderError;
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get order items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .select(`
        *,
        product:product_id (image_url, category)
      `)
      .eq("order_id", orderId);

    if (itemsError) throw itemsError;

    res.json({
      ...order,
      items: items || []
    });

  } catch (err) {
    console.error("Order fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all orders for user
app.get("/api/orders", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(orders || []);

  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get seller's sales (orders where user is seller)
app.get("/api/sales", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { data: sales, error } = await supabaseAdmin
      .from("order_items")
      .select(`
        *,
        order:order_id (
          status,
          payment_status,
          created_at,
          paid_at,
          buyer_id
        )
      `)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(sales || []);

  } catch (err) {
    console.error("Sales fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's transaction history
app.get("/api/transactions", async (req, res) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { data: transactions, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(transactions || []);

  } catch (err) {
    console.error("Transactions fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Stripe Webhook (for handling async payment events)
// Note: This needs raw body, so it should be before express.json() middleware
// For now, we're using the verify-payment endpoint instead
app.post("/api/stripe/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Payment successful for session:', session.id);
        // Payment verification is handled by verify-payment endpoint
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        console.log('Payment failed:', failedIntent.id);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.listen(3000, () => console.log('\nServer running on http://localhost:3000'));
