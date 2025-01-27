var express = require('express');
var router = express.Router();
const pool = require('../Database/db.js');

/* GET home page. */
router.get('/', async function(req, res, next) {
  try{
    const query = 'SELECT * FROM clanak ORDER BY datum DESC';
    const result = await pool.query(query);
    const username = res.userData && res.userData.username ? res.userData.username : "";
    res.render('index', {clanci: result.rows, username: username});
  }catch(err){
    res.send(err);
  }
});

router.get('/clanak/:id', async function(req, res, next) {
  try{
    const {id} = req.params;
    const query = 'SELECT * FROM clanak WHERE id = $1';
    const result = await pool.query(query, [id]);
    res.render('clanak', {clanci: result.rows});
  }catch(err){
    res.send(err);
  }
});

router.get('/view/:kategorija', async function(req, res, next) {
  try{
    const {kategorija} = req.params;
    const query = 'SELECT * FROM clanak WHERE kategorija = $1';
    const result = await pool.query(query, [kategorija]);
    res.render('clanakKat', {clanci: result.rows});
  }catch(err){
    res.send(err);
  }
});

router.get('/view/najnovije', async function(req, res, next) {
  try{
    const query = 'SELECT * FROM clanak ORDER BY datum DESC';
    const result = await pool.query(query);
    res.render('clanakKat', {clanci: result.rows});
  }catch(err){
    res.send(err);
  }
});

router.get('/Komentari/Clanak/:id', async function (req, res, next) {
  try{
    const {id} = req.params;// id = req.params.id
    const query = 'SELECT * FROM komentar kk INNER JOIN korisnik k ON kk.korisnik_id = k.id WHERE clanak_id = $1;';
    console.log(id);
    const result = await pool.query(query, [id]);
    res.render('Komentari', {info: result.rows, clanak_id: id});
  }catch (err) {
    console.error('Error during login:', err);
    res.status(500).send("Greška na serveru");
  }
});

router.post('/Komentari/dodaj/:id', async function (req, res, next) {
  try{
    const {id} = req.params;
    const query = 'INSERT INTO komentar(korisnik_id, poruka, clanak_id) VALUES (' +
        ' (SELECT id FROM korisnik WHERE email = $1), $2, $3);';
    await pool.query(query, [res.userData.email, req.body.poruka, id]);
    res.redirect('/Komentari/Clanak/'+id);
  }catch (err) {
    console.error('Error during login:', err);
    res.status(500).send("Greška na serveru");
  }
});

router.post('/search', async function (req, res, next) {
  try {

    const query = `
            SELECT * 
            FROM clanak 
            WHERE naslov ILIKE '%' || $1 || '%';
        `;
    const result = await pool.query(query, [req.body.nesta]);
    res.render('clanakKat', { clanci: result.rows });
  } catch (err) {
    console.error('Error during search:', err);
    res.status(500).send("Greška na serveru");
  }
});

router.post('/lajkuj/:p/:idC', async function (req, res, next) {
  try {
    const {p, idC} = req.params;
    console.log(p, idC);
    const query = `
            UPDATE komentar SET lajk = lajk+1 WHERE id = (SELECT id FROM komentar WHERE poruka = $1);
        `;
    const result = await pool.query(query,[p]);
    res.redirect('/Komentari/Clanak/' + idC);
  } catch (err) {
    console.error('Error during search:', err);
    res.status(500).send("Greška na serveru");
  }
});

router.post('/dislajk/:p/:idC', async function (req, res, next) {
  try {
    const {p, idC} = req.params;
    console.log(p, idC);
    const query = `
            UPDATE komentar SET dislajk = dislajk+1 WHERE id = (SELECT id FROM komentar WHERE poruka = $1);
        `;
    const result = await pool.query(query,[p]);
    res.redirect('/Komentari/Clanak/' + idC);
  } catch (err) {
    console.error('Error during search:', err);
    res.status(500).send("Greška na serveru");
  }
});






module.exports = router;
