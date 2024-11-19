import dotenv from 'dotenv';
dotenv.config(); // Configure environment variables

import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import ejs from 'ejs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import punycode from 'punycode';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';


const app = express()
app.use(express.json());

app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
app.use(cors())
app.use(bodyParser.urlencoded({
    extended: true
}));

let URL = "mongodb+srv://"+process.env.SECURITY_KEY_USER+":"+process.env.SECURITY_KEY+"@cryptowatchers.vpiit9o.mongodb.net/userDB";

mongoose.connect(URL);


const userSchema = {
    userName: String,
    userEmail: String,
    password: String,
    coins: Array
}


const User = new mongoose.model("User", userSchema);


async function ValidateEmail(email)
{
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                    
    // console.log(email);
    if(await email.match(mailformat))
    {
        return 200;
    }
    else
    {
        return 800;
    }
}

app.get("/", function(req, res){
    res.send("Hello");
})

app.post("/register", async function(req, res){


    let name = req.body.name;
    let email = req.body.email;
    email = email.toLowerCase();
    let password = req.body.password;

    console.log("called Here");
    let customStatus = await ValidateEmail(email);
    if(customStatus === 800)
    {
        res.send(customStatus)
    } else {

        
        const user = new User ({
            userName: name,
            userEmail: email,
            password: password
        });

        User.exists({userEmail: email}, async function (err, isAlready) {
            if (err){
                console.log(err)
            }else{
                
                if(isAlready === null)
                {
                    await user.save();  
                    customStatus = 200;
                    res.send(email);
                }
                else
                {
                    customStatus = 801
                    await res.send(customStatus);
                }
            }

        });  
    }
    
});





app.post("/login", async function(req,res){
    let email = req.body.email;
    email = email.toLowerCase();
    let password = req.body.password;
    let customStatus = 0;
    let userDetails = await User.findOne({userEmail: email});
    // console.log(userDetails);
    
    if(userDetails == null)
    {
        customStatus = 900;
    } else if (userDetails.password != password) {
        customStatus = 901;
        // console.log(userDetails.password);
    } else {
        customStatus = 200;
        return(
            res.send(userDetails.userEmail)
        )
    }
    return(
        res.send(customStatus)
    )
})





app.post("/add", async function(req,res){
    let coinId = req.body.coinsId;
    let userId = req.body.userId;
    userId = userId.slice(1, -1);
    ;
    let user = await User.findOne({userEmail: userId});
    
    if(user.coins.includes(coinId))
    {
        return(res.send("Coin Already Exist"));
    } else {
        await User.updateOne(
            { "userEmail" : userId },
            { $push: { "coins" : coinId } }
         );
         return (res.send("Successfully Added"));
    }

})

app.post("/remove", async function(req, res){
    let coinId = req.body.coinsId;
    let userId = req.body.userId;
    userId = userId.slice(1, -1);

    await User.updateOne(
        { "userEmail" : userId },
        { $pull: { "coins" : coinId } }
     );
    
     return (res.send("Deleted!!!"));
})



app.post("/giveArray", async function(req,res){

    let userId = req.body.userId;
    userId = userId.slice(1, -1);
    let allCoins = await User.findOne({userEmail: userId});
    // console.log(allCoins);
    return(res.send(allCoins))
})





app.get('/giveGraph', async (req, res) => {
    const url = 'https://www.coingecko.com/?items=300';

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Set headers to mimic a real browser
        await page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9",
        });

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
        );

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Get the page content
        const content = await page.content();
        const $ = cheerio.load(content);

        let str = "7d chart";
        const selector = `img[alt*="${str}"]`;

        const images = [];
        $(selector).each((index, img) => {
            const src = $(img).attr("src");
            const alt = $(img).attr("alt");
            images.push({ src, alt });
        });

        await browser.close();
        res.json(images);
    } catch (err) {
        console.error('Error fetching or parsing data:', err.message);
        res.status(500).send('An error occurred');
    }
});



// if(process.env.NODE_ENV == "production")
// {
//     app.use(express.static("client/build"));
//     const path = require("path");
//     app.get("*", function(req, res){
//         res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
//     });
// }



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3001;
}
app.listen(port);
