const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const history = require('connect-history-api-fallback');
const upload = require('multer')({ dest: 'server/uploads/' });
const Controller = require('./Controller.js');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();
const app = express();

// middleware functions -------------------------------------------------------
//
// example request
// curl -X POST -d JSON=test localhost:8000/?query=test
//
// redirect requests to https (only on heroku)
app.use(async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    next();
  } else if (req.header('x-forwarded-proto') === 'https') {
    next();
  } else {
    console.log('redirected to https');
    res.redirect('https://' + req.headers.host + req.url);
  }
});
//
// allow cross origin requests
// (for convenience duing Vue development)
app.use(cors({
  origin: true,
  credentials: true
}));
//
// make JSON data easily accessible in req.body
app.use(express.json());
//
// make POST data easily accessible in req.body
app.use(express.urlencoded({
  extended: true
}));
//
// make cookies easily acessible in req.cookies
app.use(cookieParser());
//
// set cache headers (disable caching)
// since we are using an SPA, we do not want persisting data
// after the user logs out or navigates away
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
// logging
app.use(async (req, res, next) => {
  console.log();
  console.log('path:    ' + req.path);
  console.log('cookies: ' + JSON.stringify(req.cookies));
  console.log('body:    ' + JSON.stringify(req.body)); // data of POST request
  console.log('query:   ' + JSON.stringify(req.query)); // data of GET request
  next();
});
//
// authenticate
app.use(async (req, res, next) => {
  const authenticateResult = await Controller.authenticate(req.cookies);
  req.authentication = authenticateResult;
  console.log('authenticated: ' + authenticateResult.success);
  console.log('sbu_id: ' + authenticateResult.sbu_id);
  console.log('isGPD: ' + authenticateResult.isGPD);
  console.log('department: ' + authenticateResult.department);

  // temporary: allow all requests through as if user was GPD -------------
  req.authentication.isGPD = true;
  // temporary ------------------------------------------------------------

  if (authenticateResult.success || req.path === '/login.html' ||
    req.path === '/api/login' || req.path === '/api/authenticate' ||
    req.path === '/favicon.ico' || req.path === '/sbulogo.png' ||
    req.path === '/stonybrook.png') {
    next();
  } else {
    res.redirect('/login.html'); // login failed
  }
});
//
// if this is an API call, do nothing
// if this is not an API call, redirect requests to index.html
// (without this, a request to a Vue component like /login will 404
// since index.html is the only actual static file)
app.use(async (req, res, next) => {
  if (/\/api\/.*/.test(req.path)) {
    next();
  } else {
    history()(req, res, next); // non-API call, redirect to index.html
  }
});
//
// use /public as the directory to serve static resources (eg. index.html)
// note that the history() middleware will not redirect static files
// (eg. those that end in some .extension) and so express will route those
// correctly using this static path
app.use(express.static(path.join(__dirname, 'public')));
//
// end of middleware ----------------------------------------------------------

// RESTful API to interact with system
//
// login
app.post('/api/login', async (req, res) => {
  const loginResult = await Controller.login(req.body);
  console.log(loginResult);
  res.cookie('jwt', loginResult.jwt);
  if (loginResult.success) {
    if (loginResult.isGPD) {
      res.redirect('/gpdhomepage');
    } else {
      res.redirect('/studenthomepage');
    }
  } else {
    res.redirect('/login.html');
  }
});
//
// authenticate using jwt stored as cookie
app.post('/api/authenticate', async (req, res) => {
  const response = await Controller.authenticate(req.cookies);
  res.send(response);
});
//
// lower priviledge API call to get student by id
// only allowed if authenticated id is the same as request id
app.get('/api/student/:id', async (req, res, next) => {
  if (!req.authentication.isGPD && req.authentication.sbu_id !== req.params.id) {
    next();
  } else {
    const result = await Controller.getByID('student', req.params.id, req.query);
    res.send(result);
  }
});
//
// lower priviledge API call to get course plan by student id
app.get('/api/student/courseplan/:id', async (req, res, next) => {
  if (!req.authentication.isGPD && req.authentication.sbu_id !== req.params.id) {
    next();
  } else {
    const result = await Controller.getCoursePlanByID(req.params.id);
    res.send(result);
  }
});
//
// get student's degree requirement and course plan status
app.get('/api/student/degreestatus/:id', async (req, res, next) => {
  if (!req.authentication.isGPD && req.authentication.sbu_id !== req.params.id) {
    next();
  } else {
    const result = await Controller.getStudentStatus(req.params.id);
    res.send(result);
  }
});
//
// check if email is unique
app.post('/api/uniqueEmail', async (req, res) => {
  const check = await Controller.uniqueEmail(req.body);
  console.log('uniqueEmail: ' + check);
  res.sendStatus(check);
});
//
// only allow further API access if user is GPD
app.all(/\/api\/.*/, async (req, res, next) => {
  if (req.authentication.isGPD) {
    console.log('GPD user, API access granted');
    next();
  } else {
    console.log('Student user, API access forbidden');
    res.sendStatus(403); // forbidden
  }
});
//
// reset all tables
app.all('/api/reset', async (req, res) => {
  const status = await Controller.reset();
  res.sendStatus(status); // method not allowed
});
//
// notify student that their course plan has an invalid entry
app.post('/api/notifyInvalidPlan', async (req, res) => {
  await Controller.sendEmail(req.body.message, req.body.address);
  res.sendStatus(200);
});

// upload and import file using multipart post request
app.post('/api/import/:type', upload.single('file'), async (req, res) => {
  lock.acquire('importLock', async function () { // lock to handle concurrent imports
    console.log(req.file);
    req.query.department = req.authentication.department;
    const importResults = await Controller.import(req.file, req.params.type, req.query);
    console.log(importResults);
    res.send(importResults);
  });
});
//
// get all resources
app.get('/api/:whatToGet', async (req, res) => {
  const result = await Controller.getAll(req.params.whatToGet, req.query);
  res.send(result);
});
// get resource by id
app.get('/api/:whatToGet/:id', async (req, res) => {
  const result = await Controller.getByID(req.params.whatToGet, req.params.id, req.query);
  res.send(result);
});
// add new student
app.post('/api/student', async (req, res) => {
  const status = await Controller.postStudent(req.body);
  res.sendStatus(status);
});
// edit student comments
app.put('/api/student/comment/:id', async (req, res) => {
  const status = await Controller.putComment(req.params.id, req.body);
  res.sendStatus(status);
});
// edit student
app.put('/api/student/:id', async (req, res) => {
  const status = await Controller.putStudent(req.params.id, req.body);
  res.sendStatus(status);
});
// add course plan entry
app.post('/api/courseplan', async (req, res) => {
  req.query.department = req.authentication.department;
  const result = await Controller.importCoursePlanWrapped([req.body], req.query);
  const status = (result.failed === 1) ? 400 : 200;
  res.sendStatus(status);
});
//
app.post('/api/addsuggested', async (req, res) => {
  req.query.department = req.authentication.department;
  req.query.waived = 'waived';
  await Controller.importCoursePlanWrapped(req.body, req.query);
  res.sendStatus(200);
});
// add proficiency requirement
app.post('/api/student/proficiency/:id', async (req, res) => {
  const status = await Controller.addProficiency(req.params.id, req.body);
  res.sendStatus(status);
});
app.post('/api/suggestplan/:id', async (req, res) => {
  const result = await Controller.suggestCoursePlan(req.params.id, req.body);
  res.send(result);
});
// add new resource (non-student)
app.post('/api/:whatToPost', async (req, res) => {
  const status = await Controller.post(req.params.whatToPost, req.body);
  res.sendStatus(status);
});
// edit resource
app.put('/api/:whatToPut/:id', async (req, res) => {
  const status = await Controller.put(req.params.whatToPut, req.params.id, req.body);
  res.sendStatus(status);
});
// delete all resources
app.delete('/api/:whatToDelete', async (req, res) => {
  const status = await Controller.deleteAll(req.params.whatToDelete, req.authentication.department);
  res.sendStatus(status);
});
// delete resource by id
app.delete('/api/:whatToDelete/:id', async (req, res) => {
  const status = await Controller.deleteByID(req.params.whatToDelete, req.params.id);
  res.sendStatus(status);
});
// catch all for any invalid api calls
app.all(/\/api\/.*/, async (req, res) => {
  res.sendStatus(400); // bad request
});
//
// end of API functions -------------------------------------------------------

// listen on localhost:8000
const port = process.env.PORT || 8000;

if (process.env.NODE_ENV === 'production') {
  app.listen(port, () => {
    console.log('http server started on port ' + port);
  });
} else {
  https.createServer({
    key: fs.readFileSync('./server/certs/server.key'),
    cert: fs.readFileSync('./server/certs/server.cert')
  }, app).listen(port, () => {
    console.log('https server started on port ' + port);
  });
}
