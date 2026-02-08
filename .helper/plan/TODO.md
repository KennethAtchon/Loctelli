create a markdown research file, do deep research, my goal is to create a card style form system, but keep the existing simple-form we have now, and do a rebrand of the current form to simple form, the card style from will have really good animating for each card form, have it like this question on top, then image, then multiple choice or enter text or whatever, basically an enhance version of the current implementation, we will also add fields to the admin panel form system to make this card system actually work as intended, admins can choose to either create an ehanced card form or a simple form, etc, etc, so create a doc with all these features AND MORE features that would be better, also at the end of the card creation, we can maybe have a user profile estimator (based on the clients answers to the questions, we can have an AI enhanced or not, algorithm that computes the end goal), like the form is about how much of an outdoor person you are, and we compute that its 80% given the questions


------

fix tests


----

Create plans for each of this:

Feature request:


AI to build the card form (At the top of card form), have a button that opens up a modal for an AI text bot, we have the system prompt of the ai be like "Ask clarifying questions and create the output (JSON for card builder) for this user". The AI goal is to create a form builder based on what the user wants. It doesn't have image upload, rather to get images, the user has to provide links. This will be the alternative paths for users who dont want to use the fine grained customizations that card form builder provides. This will load the thing the user wants automatically (when they are creating or edititng), and useer can customize further.

Now choice is, should we use the prompt data model system to make the prompt there with a seed. Or not give the user option at all, andd have the prompt hardcoded on the server.

