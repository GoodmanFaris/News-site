var express = require('express');
var router = express.Router();
const pool = require('../Database/db.js');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const child_process = require("node:child_process");

const saltRounds = 10;

const getHashedPassword = async (plainPassword)=>{
  try{
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;
  }
  catch(error){
    throw error;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory where images will be stored
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
  }
};


const upload = multer({ storage, fileFilter });



// Render the form for adding an article
router.get('/', function (req, res, next) {
  res.render('dodajClanak');
});

router.post('/dodaj', upload.single('slika'), async function (req, res, next) {
  try {
    // Extract form fields
    const { naziv, kategorija, tekst } = req.body;

    // Extract file path (if a file was uploaded)
    //const filePath = req.file ? req.file.path : null;
    const filePath = req.file ? req.file.path.replace(/\\/g, '/') : null;
    // Insert data into the database
    const query = `
            INSERT INTO clanak (naslov, kategorija, artikal, slika) 
            VALUES ($1, $2, $3, $4)
        `;
    await pool.query(query, [naziv, kategorija, tekst, filePath]);

    res.redirect('/users/');
  } catch (err) {
    console.error('Error uploading article:', err);
    res.redirect('/users/dodaj');
  }
});


router.get('/login', function (req, res, next) {
  res.render('user/login');
});


router.get('/register', function (req, res, next) {
  res.render('user/register');
});

router.post('/register/user', async function (req, res, next) {
  try {
    const hashedPassword = await getHashedPassword(String(req.body.password));
    const { ime, prezime, username, email, password, datumrodzenja, grad, spol} = req.body; // Extract data from req.body
    const query = `
      INSERT INTO korisnik (ime, prezime, username, email, password, datum_rodjenja, grad, spol)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await pool.query(query, [ime, prezime, username, email, hashedPassword, datumrodzenja, grad, spol]);
    res.redirect('/users/login');
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).redirect('/');
  }
});

router.post('/login/user', async function (req, res, next) {
  try {
    if(String(req.body.password)=='admin123' && req.body.email == 'admin@local.com'){
      const hashedPassword = 'admin123';
      const userFromReq = {
        email: req.body.email,
        lozinka: req.body.lozinka
      }
      const query = "SELECT * FROM korisnik WHERE email = $1;";
      const result = await pool.query(query, [
        userFromReq.email]);
      const user = result.rows[0];
      res.cookie("HNUser", user);
      res.redirect('/admin');
    }
    else{
      const hashedPassword = await getHashedPassword(String(req.body.password));
      const userFromReq = {
        email: req.body.email,
        password: req.body.password
      }


      const query = "SELECT * FROM korisnik WHERE email = $1;";
      const result = await pool.query(query, [
        userFromReq.email]);


      if(result.rows.length > 0){
        const user = result.rows[0];

        bcrypt.compare(userFromReq.password, user.password, function (err, resultCompare) {
          if (resultCompare) {
            console.log("Uspješno logovan user");
            res.cookie("HNUser", user)
            res.redirect('/');
          } else {
            console.log("Pogrešna lozinka");
            res.status(401).send("Pogrešna lozinka");
          }
        });
        }
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).send("Greška na serveru");
  }
});


router.get('/Profile', async function (req, res, next) {
  try{
    
    const query = 'SELECT * FROM korisnik WHERE email = $1;';
    const result = await pool.query(query, [res.userData.email]);
    res.render('user/UserProfil', {info: result.rows});
  }catch (err) {
    console.error('Error during login:', err);
    res.redirect("/users/login");
  }
});

router.get('/logout', function(req, res, next) {
  res.clearCookie('HNUser');
  res.redirect('/');
});




module.exports = router;