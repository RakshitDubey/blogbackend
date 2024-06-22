const express=require('express')

const router=express.Router()

const User=require('../models/User')
const bcrypt=require('bcrypt')

const jwt=require('jsonwebtoken')

// register  

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user instance
        const newUser = new User({ username, email, password: hashedPassword });

        // Save the new user to the database
        const savedUser = await newUser.save();

        // Send response with saved user details (excluding password)
        res.status(200).json({
            _id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
// login

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }); // Await User.findOne()
        if (!user) {
            return res.status(400).json("User not found");
        }

        const match = await bcrypt.compare(req.body.password, user.password); // Compare hashed password

        if (!match) {
            return res.status(401).json("Wrong Credentials");
        }
        const token=jwt.sign({_id:user._id,username:user.username,email:user.email},process.env.SECRET_KEY,{expiresIn:'3d'})
        const {password,...info}=user._doc
        res.cookie('token',token).status(200).json(info)

        
    
    } catch (error) {
        res.status(500).json({ error: error.message }); // Send error message in response
        console.log(error);
    }
});

// logout
router.get('/logout',async(req,res)=>{
    try {
        res.clearCookie('token',{sameSite:'none',secure:true}).status(200).send("User loggedout Successfully")
    } catch (error) {
        res.status(500).json({ error: error.message }); // Send error message in response
        console.log(error);
        
    }

})

router.get('/refetch',(req,res)=>{
    const token=req.cookies.token
    jwt.verify(token,process.env.SECRET_KEY,async(err,data)=>{
        if(err){
            return res.status(404).json(err)
        }
        res.status(200).json(data)
    })
})

module.exports=router