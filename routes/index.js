var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post")
const localStrategy = require('passport-local');
const passport = require('passport');
const upload = require("./multer");

passport.use(new localStrategy(userModel.authenticate()));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.render('login',{error:req.flash('error')});
});

router.post('/upload', isLoggedIn ,upload.single("file") ,async function(req, res,next){
  if(!req.file){
    return res.status(404).send('no files were uploded');
  }
  const user = await userModel.findOne({username: req.session.passport.user})
  const post = await postModel.create({
    imageText:req.body.filecaption,
    image: req.file.filename,
    user:user._id
  });
  user.posts.push(post._id);
  await user.save();
 res.redirect("profile");
});

router.get('/profile',isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({
    username:req.session.passport.user
  })
  .populate("posts");
  console.log(user);
  res.render("profile",{user});
});

router.post('/register', function(req, res, next) { // yaha pe post hi aayega plz get mat likha na 
  const { username, email, fullname } = req.body;
let userdata = new userModel({ username, email, fullname });

  userModel.register(userdata,req.body.password)
  .then(function(registereduser){
    passport.authenticate("local")(req,res,function(){
      res.redirect('/profile');
    })
  })
});

router.post('/login',passport.authenticate('local',{
  successRedirect:"/profile",
  failureRedirect:"/login",
  failureFlash:true
}),function(req,res){})

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/login');
}



module.exports = router;
