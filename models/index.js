'use strict';

let fs = require('fs');
let path = require('path');
let request = require('request');
let Sequelize = require('sequelize');
let basename = path.basename(__filename);
let env = process.env.NODE_ENV || 'development';
let config = require(__dirname + '/../config/config.js')[env];
let github = require(__dirname + '/../config/github.js');
let db = {};

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  var sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach((file) => {
    let model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.syncGitHubData = syncGitHubData;
db.sequelize.sync({
    force: true
  })
  .then(function() {
    db['users'].create({
      email: 'stewart.dulaney@gmail.com',
      password: '1234',
      gh_name: '',
      gh_handle: 'sdulaney',
      gh_avatar_url: '',
      gh_location: '',
      gh_blog: '',
      gh_public_repos: 0,
    }).then((user) => {
      syncGitHubData("sdulaney", user.user_id);
    });

    db['users'].create({
      email: 'antiteal@gmail.com',
      password: 'password',
      gh_name: '',
      gh_handle: '',
      gh_avatar_url: '',
      gh_location: '',
      gh_blog: '',
      gh_public_repos: 0,
    }).then((user) => {
      syncGitHubData("AntiTeal", user.user_id);
    });

    let initialJobs = initJobs();
    db['jobs'].bulkCreate(initialJobs);
  });

// Helper functions
/**
 * Returns seed data for the Jobs database table.
 * @return {array} jobs seed data
 */
function initJobs() {
  let initialJobs = [
      {companyid: 1, position: 'Software Engineer', language: 'C++', framework: 'Boost', address: '523 Ocean Front Walk', city: 'Venice', state: 'CA', zip_code: '90291', country: 'United States', latitude: '33.99278', longitude: '-118.4786'},
      {companyid: 2, position: 'Software Engineer', language: 'C++', framework: 'Qt', address: '13031 W Jefferson Blvd #200', city: 'Los Angeles', state: 'CA', zip_code: '90094', country: 'United States', latitude: '33.97572', longitude: '-118.4264'},
      {companyid: 3, position: 'Software Development Engineer - Amazon Prime Video', location: 'Santa Monica, CA', language: 'Java', framework: 'Apache Struts', address: '1620 26th St', city: 'Santa Monica', state: 'CA', zip_code: '90404', country: 'United States', latitude: '34.0294', longitude: '-118.47088'},
      {companyid: 4, position: 'Software Engineer', language: 'PHP', framework: 'Laravel', address: '12777 W Jefferson Blvd', city: 'Los Angeles', state: 'CA', zip_code: '90066', country: 'United States', latitude: '33.97804', longitude: '-118.41817'},
      {companyid: 5, position: 'Software Engineer, Tools and Infrastructure', language: 'C++', framework: 'TensorFlow', address: '340 Main St', city: 'Venice', state: 'CA', zip_code: '90291', country: 'United States', latitude: '33.99549', longitude: '-118.476681'},
      {companyid: 6, position: 'Software Engineer, Motion Graphics', language: 'Swift', framework: 'Alamofire', address: '8777 Washington Blvd', city: 'Culver City', state: 'CA', zip_code: '90232', country: 'United States', latitude: '34.02862', longitude: '-118.38645'},
      {companyid: 7, position: 'Software Developer - Content (Metadata Platform)', language: 'Python', framework: 'Django', address: '2500 Broadway', city: 'Santa Monica', state: 'CA', zip_code: '90404', country: 'United States', latitude: '34.03051', longitude: '-118.47363'},
      {companyid: 8, position: 'Software Development Engineer in Test - Norton Engineering', language: 'C++', framework: 'Boost', address: '900 Corporate Pointe', city: ', Culver City', state: 'CA', zip_code: '90230', country: 'United States', latitude: '33.98784', longitude: '-118.38892'},
  ];

  return initialJobs;
}

/**
 * Returns seed data for the Companies database table.
 * @return {array} companies seed data
 */
function initCompanies() {
  let initialCompanies = [
      {name: 'Snap Inc.'},
      {name: 'Microsoft'},
      {name: 'Amazon'},
      {name: 'Facebook'},
      {name: 'Google'},
      {name: 'Apple'},
      {name: 'Hulu'},
      {name: 'Symantec'},
  ];

  return initialCompanies;
}

/**
 * Implements running Promises serially rather than concurrently. An alternative to Promise.all.
 * Implemented in order to run requests to GitHub's API serially, in order to not get rate limited.
 * Code taken from https://stackoverflow.com/a/37579083
 * @param {Array} providers - An array of *functions* that return Promises
 * @return {Promise} A promise that represents an array of values that are the resolved providers
 */
Promise.series = function series(providers) {
    const ret = Promise.resolve(null);
    const results = [];

    return providers.reduce(function(result, provider, index) {
         return result.then(function() {
            return provider().then(function(val) {
               results[index] = val;
            });
         });
    }, ret).then(function() {
        return results;
    });
}

/**
 * Retrieves data about a user's GitHub account and writes it to the database.
 * @param {string} username - The GitHub username.
 * @param {number} userid - The user's id in the GitRecruiter database.
 */
function syncGitHubData(username, userid) {
  getGitHubUser(username).then((user) => {
    db['users'].update({
      gh_name: user.name,
      gh_avatar_url: user.avatar_url,
      gh_location: user.location,
      gh_blog: user.blog,
      gh_public_repos: user.public_repos
    }, {
      where: {user_id: userid}
    }); 
  });
  getGitHubRepos(username).then((repos) => {
    var langPromises = [],
        topicPromises = [];

    repos.forEach((repo) => {
      langPromises.push(function() {return getGitHubRepoLangs(repo)});
    });

    Promise.series(langPromises).then(langData => {
      var languages = {};
      langData.forEach((langArray) => {
        langArray.forEach((langObj) => {
          if(languages[langObj.lang])
            languages[langObj.lang] += langObj.bytes;
          else
            languages[langObj.lang] = langObj.bytes;
        });
      });

      Object.entries(languages).forEach((lang) => {
        db['user_languages'].upsert({
          gh_language: lang[0],
          gh_bytes: lang[1],
          user_id: userid
        });
      });

      repos.forEach((repo) => {
        topicPromises.push(function() {return getGitHubRepoTopics(repo)});
      });

      Promise.series(topicPromises).then(topicData => {
        var topics = {};
        topicData.forEach((topicArray) => {
          topicArray.forEach((topic) => {
            if(topics[topic])
              topics[topic]++;
            else
              topics[topic] = 1;
          });
        });

        Object.entries(topics).forEach((topic) => {
          db['user_topics'].upsert({
            gh_topic: topic[0],
            count: topic[1],
            user_id: userid
          });
        });
      });
    });
  });
}

/**
 * Retrieves publicly available information about the specified GitHub account.
 * @param {string} username - The GitHub username.
 * @return {promise} GitHub user's publicly available information
 */
function getGitHubUser(username) {
  var options = {
    url: `https://api.github.com/users/${username}`,
    headers: {
      'Authorization': `token ${github.token}`,
      'User-Agent': 'request'
    }
  };
  return new Promise(function(resolve, reject) {
    request.get(options, function(err, resp, body) {
      if (err) {
        reject(err);
      }
      else {
        resolve(JSON.parse(body));
      }
    });
  });
}

/**
 * Retrieves all the repos of a specified user
 * @param {string} username
 * @return {promise} GitHub user's repos
 */
function getGitHubRepos(username) {
  var options = {
    url: `https://api.github.com/users/${username}/repos`,
    headers: {
      'Authorization': `token ${github.token}`,
      'User-Agent': 'request'
    }
  };
  return new Promise(function(resolve, reject) {
    request.get(options, function(err, resp, body) {
      if (err) {
        reject(err);
      }
      else {
        var data = JSON.parse(body),
            repos = [];
        for (var repo in data) {
          repos.push(repo.full_name);
        }
        resolve(repos);
      }
    });
  });
}

/**
 * Retrieves programming languages for the specified GitHub repository.
 * @param {string} repoName
 * @return {Promise} Promise object that represents an array containing an object with keys lang and bytes
*/
function getGitHubRepoLangs(repoName) {
  var options = {
    url: `https://api.github.com/repos/${repoName}/languages`,
    headers: {
      'Authorization': `token ${github.token}`,
      'User-Agent': 'request'
    }
  };
  return new Promise(function(resolve, reject) {
    request.get(options, function(err, resp, body) {
      if (err) {
        reject(err);
      }
      else {
        var data = JSON.parse(body);
        resolve(Object.keys(data).map(lang => ({lang, bytes: data[lang] })));
      }
    });
  });
}

/**
 * Retrieves topics for the specified GitHub repository.
 * @param {string} repoName
 * @return {Promise} Promise object that represents an array of repoName's topics
 */
function getGitHubRepoTopics(repoName) {
  var options = {
    url: `https://api.github.com/repos/${repoName}/topics`,
    headers: {
      'Authorization': `token ${github.token}`,
      'User-Agent': 'request',
      'Accept': 'application/vnd.github.mercy-preview+json'
    }
  };
  return new Promise(function(resolve, reject) {
    request.get(options, function(err, resp, body) {
      if (err) {
        reject(err);
      }
      else {
        resolve(JSON.parse(body).names);
      }
    });
  });
}

module.exports = db;