fix ghl integrations

ghl api calls for auto changing tags/opportunities

in ghl integrations in frontend, need a way for it to download snapshot/ fix it


-------


Uncaught TypeError: navigator.vibrate is not a function

-------

For the Integration for GHL


Lets make this functional, create a plan - Please create an overview on how GHL integrations currently work, literally how it flows and everything

We need to stop using env api key for GHL and version and include it in the GHL integration, I think the flow already kinda works - by taking the location id and looking for an integration, since one integration per subaccount, we can find the subaccount thats attached on our side, then the rest of the flow seams to work 

Ultimate goal is to get it to work seamless from the frontend,  completely independent from ENVs

