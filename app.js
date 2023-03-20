const express = require("express");
const uuid = require("uuid");
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const FileSet = require('file-set');
const shuffle = require('shuffle-array');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const basicAuth = require('express-basic-auth');
var nodemailer = require('nodemailer');

const mongoose = require('mongoose');
const dbconfig = require('./config/database');
const config = {
    "images": new FileSet(path.join('static', 'images', '*', 'medium') + "/*.jpg").files,
    "max_images": 800,
    "cookie_secret": "resistance is futile",
    "cookie_max_age": 10 * 24 * 60 * 60 * 1000, // 10 days,
    "end_date": "2021-06-01",
    "email_address": "your@email.de", // e.g. a google mail address for this purpose
    "email_password": "yourmagicpassword", // in case of gmail, there is an app-password
    "target_email_address": "your target email address",
    "like_views": true,
    "clickworker_key": "abcdef",
    "clickworker": false,
    "winningform": false,
    "lab_test": true
};


if (config['like_views']) {
    // read likes/views
    const likes_views = JSON.parse(fs.readFileSync('./static/images/likes_views.json', 'utf8'));
    config["like_views_list"] = likes_views;
    config["like_views_map"] = {};

    for (var i =0; i < likes_views.length; i++) {
        let img = likes_views[i];
        img["image_path"] = "static/images/" + img["image_path"].replace("/images/", "/medium/");
        config["like_views_map"][img["image_path"]] = img
    }
    function has_real_like_views(curr_image, likes_views_map) {
        return likes_views_map[curr_image] !== undefined && likes_views_map[curr_image]["real"];
    }

    // filter images so that they only have real views and likes:
    console.log(config["images"].length);
    config["images"] = config["images"].filter(image => has_real_like_views(image, config["like_views_map"]))

    console.log(config["images"].length);
    console.log("done");
    //process.exit(1);

}

// to access the statistics, see /stats
const auth = basicAuth({
    users: { 'stg7': 'test' },
    challenge: true,
});

// load data models
let User = require('./models/user');
let Image = require('./models/image');
let Email = require('./models/email');


console.log(config);
console.log(config["images"].length);

function db_error_handling() {
    // check for DB errors
    db.on('error', (err) => {
        console.log(err);
    });
}

// connect to database; take production or development database (preference for production)
mongoose.connect(dbconfig.database, {useNewUrlParser: true }).then(
    () => {
        console.log(`opened production database: ${dbconfig.database}`);
        db_error_handling();
    },
    err => {
        console.log(`try to connect to development database: ${dbconfig.database_dev}`);
        mongoose.connect(dbconfig.database_dev, {useNewUrlParser: true })
        db_error_handling();
    }
);

let db = mongoose.connection;

// check connection
db.once('open', () => {
    console.log('connected to mongoDB, lets start the party');
});

const app = express();
const port = 9999;

// views and static files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use('/static', express.static('static'));

// middleware registration
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies
app.use(cookieParser());

// define routes

app.get("/", (req, res) => {
    let params = req.originalUrl.replace(req.path, "");

    res.cookie('query_params', params, { maxAge: config["cookie_max_age"], httpOnly: true });

    //
    res.render(
        'pages/index',
        {
            text:"resistance is futile!..",
            lab_test: config["lab_test"]
        }
    );
});

app.get("/about", (req, res) => {
    res.render(
        'pages/about',
        {text:"resistance is futile!.."}
    );
});

app.get("/finished", (req, res) => {



    user_uuid = req.cookies['uuid'];
    console.log(`uuid ${user_uuid}`);

    User.find({uuid: user_uuid}, (err, data) => {
        if (err || data.length == 0) {
            console.log("something wrong with user");
            console.log(data);
            //res.json({"msg": "error"});
            res.redirect("/");
            return;
        };
        res.cookie('test_done', config["cookie_secret"], { maxAge: config["cookie_max_age"], httpOnly: true });
        user_completed = data[0]['image_index'] >= config['max_images'];
        res.render(
            'pages/finished',
            {
                text: "resistance is futile!..",
                uuid: req.cookies['uuid'],
                winningform: config["winningform"],
                lab_test: config["lab_test"],
                end_date: config["end_date"],
                clickworker: config["clickworker"],
                clickworker_key: config["clickworker_key"],
                user_completed: user_completed
            }
        );

    });


});

app.post("/finished", (req, res) => {
    console.log("test");
    console.log(req.body);
    /* req.body example:
    {
        email_address: 'stg7@gmx.de',
        agree: 'on',
        uuid: 'cbd99942-ea02-465a-8343-1efe378652ee'
    }
    */
    email = req.body["email_address"];
    agree = req.body["agree"];
    user_uuid = req.body["uuid"];

    // send email:

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config['email_address'],
        pass: config['email_password']
      }
    });

    var mail_options = {
      from: config['email_address'],
      to: config['target_email_address'],
      subject: 'aesthetics test',
      text: `registered email: ${email}`
    };

    transporter.sendMail(mail_options, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    email = "yes"; // we do not store the email addresses

    // check userid
    User.find({uuid: user_uuid}, (err, data) => {
        if (err || data.length == 0) {
            console.log("something wrong with user");
            console.log(data);
            res.json({"msg": "error"});
            return;
        };
        // check if uuid was already stored in email collection
        Email.find({uuid: user_uuid}, (err, data) => {

            let email_entry = new Email({
                uuid: user_uuid,
                email: email,
                agree: agree
            });

            // in case there was already the user stored, update it
            if (data.length == 1) {
                email_entry = data[0];
                email_entry["email"] = email;
                email_entry["agree"] = agree;
            }

            email_entry.save((err) => {
                if (err) {
                    console.log("error while email");
                    console.log(err);
                }
            });

            res.render(
                'pages/finished',
                {
                    text: "resistance is futile!..",
                    uuid: req.cookies['uuid'],
                    winningform: false,
                    end_date: config["end_date"]
                }
            );
        });
    });
});

// reset cookies (used for debugging)
app.get("/rc", (req, res) => {
    res.clearCookie("test_done");
    res.clearCookie("uuid");
    res.clearCookie("query_params");
    //res.json({"msg": "cookies cleared"});
    res.redirect("/");
})

app.get("/questionnaire", (req, res) => {
    if (req.cookies['test_done'] == config["cookie_secret"]) {
        res.redirect("/finished");
        return;
    }

    // create user id and image list
    let token = uuid.v4();
    console.log(`created token ${token}`);
    // store generated token in backend-db

    // create image list, and store them, later used for pre-caching
    shuffle(config["images"]);
    image_list = config["images"].slice(0, config["max_images"]);
    fake_likes_list = [];

    if (config['like_views']) {
        // double the images
        image_list = config["images"].slice(0, parseInt(config["max_images"] / 2));
        image_list_double = []
        image_list.forEach(img => image_list_double.push(img));
        image_list.forEach(img => image_list_double.push(img));
        idx_array = []
        for (var i = 0; i < image_list_double.length; i++) {
            idx_array.push(i);
        }

        fake_likes_list = []
        image_list.forEach(img => fake_likes_list.push(0));
        image_list.forEach(img => fake_likes_list.push(1));

        shuffle(idx_array);

        function permute(in_array, idx_array) {
            res_array = []
            for(var i = 0; i < idx_array.length; i++) {
                res_array.push(in_array[idx_array[i]])
            }
            return res_array;
        }

        image_list = permute(image_list_double, idx_array);

        fake_likes_list = permute(fake_likes_list, idx_array);

        /*
        for (var i = 0; i < image_list.length; i++) {
            console.log(image_list[i], fake_likes_list[i]);
        }

        process.exit(1);
        */
    }

    if (req.cookies['uuid'] != null) {
        console.log("user already did the questionnaire, so use this uuid")
        token = req.cookies['uuid']
        User.find({uuid: token}, (err, data) => {
            if (err || data.length == 0) {
                console.log("something wrong with user");
                res.json({"msg": "error"});
                return;
            }
            image_list = data[0]["image_list"];
        });
    }

    res.cookie('uuid', token, { maxAge: config["cookie_max_age"], httpOnly: true });

    console.log("create new user");
    newUser = new User({
        uuid: token,
        image_list: image_list,
        fake_likes_list: fake_likes_list,
        query_params: req.cookies["query_params"]
    });

    console.log(newUser);
    newUser.save((err) => {
        if (err) {
            console.log("error while saving");
            console.log(err);
            res.redirect("/questionnaire");
            return;
        }
        console.log("saving done");
        res.render(
            'pages/questionnaire',
            {
                text:"resistance is futile!..",
                images: image_list,
                uuid_short: token.slice(0, 3),
                lab_test: config["lab_test"]
            }
        );
    });

});

app.post("/questionnaire", (req, res) => {

    console.log(req.body);
    // store form data, and redirect to /image/:uuid with the uuid
    user_uuid = req.cookies['uuid'];
    console.log(`uuid ${user_uuid}`)
    User.find({uuid: user_uuid}, (err, data) => {
        if (err || data.length == 0) {
            console.log("something wrong with user");
            console.log(data);
            res.json({"msg": "error"});
            return;
        };

        // update user with the form data
        user = data[0];
        console.log(`got user ${data[0]["_id"]}`);

        user["age_range"] = req.body["userAgeRange"];
        user["eye_quality"] = req.body["userEyeQuality"];
        user["room_quality"] = req.body["userRoomQuality"];
        user["computer_type"] = req.body["userComputerType"];
        user["screen_size"] = req.body["screen_size"];
        user["browser_agent"] = req.body["browser_agent"];

        console.log(user);
        user.save((err) => {
            if(err){
                console.log("error while saving");
                console.log(err);
                res.redirect("/questionnaire");
                return;
            }
            res.redirect("/images/" + user_uuid);
        });

    });
});

app.post("/images/:uuid", (req, res) => {
    if (req.cookies['test_done'] == config["cookie_secret"]) {
        res.redirect("/finished");
        return;
    }

    user_uuid = req.cookies['uuid'];
    console.log(user_uuid);
    if (user_uuid === undefined) {
        res.cookie('uuid', req.body["uuid"], { maxAge: config["cookie_max_age"], httpOnly: true });
        user_uuid = req.params.uuid;
    }
    /*
    if (user_uuid != req.params.uuid) {
        res.json({"msg": "something wrong uuid"});
        return
    }*/

    console.log(`uuid ${user_uuid}`)
    User.find({uuid: user_uuid}, (err, data) => {
        if (err || data.length == 0) {
            console.log("something wrong with user");
            console.log(data);
            res.json({"msg": "something wrong with user"});
            return;
        };

        user = data[0];
        console.log(req.body);

        filename = req.body["image"];
        rating = parseInt(req.body["rating"]);
        fake = parseInt(req.body["fake"]);
        views = parseInt(req.body["views"]);
        likes = parseInt(req.body["likes"]);

        newImage = new Image({
            filename: filename,
            uuid: user_uuid,
            fake: fake,
            views: views,
            likes: likes,
            rating: rating
        });

        console.log(newImage);
        newImage.save((err) => {
            if(err){
                console.log("something wrong while saving image");
                console.log(err);
                res.json({"msg": "something wrong while saving image"});
                return;
            }
        });
        console.log(user);
        user["image_index"] += 1;
        console.log(user);
        user.save((err) => {
            if(err){
                console.log("error while saving");
                console.log(err);
                res.json({"msg": "error while saving user"});
                return;
            }
            res.redirect("/images/" + user_uuid);
        });
   });
});

app.get("/images/:uuid", (req, res) => {
    // check if uuid is valid
    let uuid = req.params.uuid;
    User.find({uuid: uuid}, (err, data) => {
        if (err || data.length == 0) {
            console.log("something wrong with user");
            res.json({"msg": "error"});
            return;
        }
        // get image
        let image_list = data[0]["image_list"];
        let image_index = data[0]["image_index"];
        let fake_likes_list = data[0]["fake_likes_list"];

        if (image_index >= image_list.length) {
            res.redirect("/finished");
            return
        }
        let curr_image = image_list[image_index];
        let next_image = curr_image;
        if (image_index + 1 < image_list.length) {
            next_image = image_list[image_index + 1];
        }
        let likes = -1;
        let views = -1;
        let fake = 0;
        if (config['like_views']) {
            if (fake_likes_list[image_index] == 1) {
                // use fake likes and views
                fake = 1;
                max_ratio = 0.5 // analysis showed that likes/views is max 0.5
                likes = config["like_views_map"][curr_image]["likes"];
                views = config["like_views_map"][curr_image]["views"];
                ratio = likes / views
                // invert the ratio and clip it
                new_ratio = Math.min(Math.max(max_ratio - ratio, 0 ), 1)
                // these are the new likes, based on the "changed ratio"
                likes = parseInt(new_ratio * views)
            } else {
                // get likes/views
                likes = config["like_views_map"][curr_image]["likes"];
                views = config["like_views_map"][curr_image]["views"];
            }
            //console.log(`likes: ${likes}`);
            //console.log(`likes: ${views}`);
        }
        res.render(
            'pages/images',
            {
                image: curr_image,
                uuid: uuid,
                likes: likes,
                views: views,
                fake: fake,
                show_likes_views: config['like_views'],
                next_image: next_image,
                image_index: image_index,
                image_length: image_list.length
            }
        );
    });
});


app.get("/stats", auth, (req, res) => {
    let emails = 0;
    let users = 0;
    let images = 0;

    Email.count({}, (err, cnt) =>{
        emails = cnt;

        User.count({}, (err, cnt) =>{
            users = cnt;

            Image.count({}, (err, cnt) =>{
                images = cnt;

                let stats = {
                    "registered_emails": emails,
                    "users": users,
                    "rated_images": images,
                    "rated_images/user": images / users
                };
                res.render(
                    'pages/text',
                    {
                        text: "statistics",
                        json: JSON.stringify(stats, null, 4)
                    }
                );
            });
        });
    });
});

// default response for any other request
app.use((req, res) => {
    res.json({message: "he is dead jim"});
});

app.listen(port, () => {
    console.log(`Server listening: http://localhost:${port}`);
});