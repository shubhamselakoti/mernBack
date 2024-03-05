require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bodyParser= require("body-parser")
var cors = require('cors')
const ejs = require('ejs')



const app = express()
app.use(express.json());

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
    res.render("Hello");
})

app.post("/register", async function(req, res){


    let name = req.body.name;
    let email = req.body.email;
    email = email.toLowerCase();
    let password = req.body.password;

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