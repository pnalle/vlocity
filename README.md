# Vlocity
## Deployment:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Dm1tryKarpenko/flosum-vlocity.git)

## How to configure Vlocity

#### Step 1: Creating the Heroku application
Go to the GitHub account provided by your Customer Success team. 
Go to the repository “Vlocity Snapshot”. 
Click the button "Deploy to Heroku" to deploy the application to Heroku. (See Fig. 1.) 

![GitHub Logo](./src/assets/img/Fig1.png)
<p style="text-align: center"><span>Fig. 1</span></p>

 
Enter application name  you want to give to this Heroku app and click the button “Deploy app”.
 

![GitHub Logo](./src/assets/img/Fig2.png) 
<div style="margin: auto"> Fig. 2</div>
 
This should result in the successful deployment of the code in the GitHub repository to the Heroku app. 
<p>For LWC auto activation required to add Buildpack for support puppeteer</p> 
https://buildpack-registry.s3.amazonaws.com/buildpacks/jontewks/puppeteer.tgz

![GitHub Logo](./src/assets/img/Fig6.png)

![GitHub Logo](./src/assets/img/Fig7.png)
 
#### Step 2: Creating “Named Credentials”
In Heroku, select Name app. Next go to the application settings page and copy the domain. (See Fig. 3.) 

![GitHub Logo](./src/assets/img/Fig3.png)
<p style="text-align: center">Fig. 3</p>
 
Now in Flosum select the Setup Gear. In the Quickfind box, search for "Named Credenitals". Then you will add a new Named Credential. Name : Vlocity_Heroku.  The URL is the domain that you just copied from Heroku. (See Fig. 4.) 

![GitHub Logo](./src/assets/img/Fig4.png)
<p style="text-align: center">Fig. 4</p>
 
#### Step 3: Creating repository for 'Vlocity' components. 
In Flosum, select the "Settings" tab. Scroll down until you see the section called “Repository” feature. Fill in all the required fields and select the "Vlocity" repository type. (See Fig. 5.)

![GitHub Logo](./src/assets/img/Fig5.png)
<p style="text-align: center">Fig. 5</p>

