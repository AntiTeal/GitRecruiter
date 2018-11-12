# GitRecruiter

An Express.js web application that matches software developers with job listings based on their location and experience with specific programming languages and frameworks (pulled from their public GitHub profiles).

## Development setup

#### 1. Install Docker

- [Mac](https://www.docker.com/community-edition#/mac)
- [Windows](https://store.docker.com/editions/community/docker-ce-desktop-windows)

#### Once Docker is installed:

Run Docker, then use your Terminal/Command Prompt to see if everything's set up. 

**On both Linux/Mac and Windows:**

```
$ docker version
```

This should output something like:

```
Client:
 Version:      17.09.0-ce
 API version:  1.32
 Go version:   go1.8.3
 Git commit:   afdb6d4
 Built:        Tue Sep 26 22:40:09 2017
 OS/Arch:      darwin/amd64

Server:
 Version:      17.09.0-ce
 API version:  1.32 (minimum version 1.12)
 Go version:   go1.8.3
 Git commit:   afdb6d4
 Built:        Tue Sep 26 22:45:38 2017
 OS/Arch:      linux/amd64
 Experimental: true
```

### 2. Set up MySQL

We'll be using Docker to run MySQL.

#### Steps:
1. Open up Terminal/Command Prompt

2. Run the following command which installs and starts running your database (only run this command the first time): 
    ```
    docker run --name gitrecruiter-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=33YJ7DAdiBnaWi9r -d mysql:8.0
    ```
    You will see a long hash output, for example `e3fe6439f5a5577b28f6ef41dfcc6c0eda4262e7335b42384cd629fb9c6d7a01`. The content of this text doesn't matter.

    - The next time you need to run the database, simply type `docker start gitrecruiter-mysql` 

3. Type `docker ps`. Your Docker container should be running MySQL and you should see something like:
    ![docker ps](https://www.stewartdulaney.com/wp-content/uploads/sites/7/2018/11/Screenshot-2018-11-11-00.28.03.png "docker ps")

### 3. Start the Express.js server

Note: these steps assume you have Node.js and npm installed. You can install both by downloading and running the installer [here](https://nodejs.org/en/download/).

#### Steps:

1. Clone this repo
2. Open up Terminal/Command Prompt
3. Type `cd [PATH_TO_REPO_FOLDER_YOU_JUST_CLONED]`
4. Type `npm install` (only do this the first time)
5. Type `npm start`
6. Open a web browser and go to http://localhost:3000/

### 4. Generate GitHub API key
You will need a GitHub API key in order to make requests to GitHub without being rate limited.

#### Steps:

1. Navigate to https://github.com/settings/tokens
2. Click Generate new token
3. Name the token GitRecruiter, and click Generate token. (You do not need any scopes selected)
4. Copy the new personal access token and put it into the `token` setting in `config/github.js`.
