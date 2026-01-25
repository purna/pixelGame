
-> start

INCLUDE ../Global.ink
INCLUDE ../Functions.ink

=== start ===

+ <b>The River's Gift - Miriam & Pharaoh’s Daughter</b>

-> discovery

=== discovery ===
#= Pharaoh's Daughter Bithiah
#speaker:Bithiah
#portrait:Bithiah_Neutral 
#layout:left 
#audio:Bithiah_mid

Halt! What is that in the water?

#= Attendant =
#speaker:Attendant
#portrait:Attendant
#layout:right 
#audio:Default_mid
It seems to be... a basket, my lady.

#= Pharaoh's Daughter Bithiah
#speaker:Bithiah
#portrait:Bithiah_Neutral 
#layout:left 
#audio:Bithiah_mid
Bring it to me.

{pause}
(A baby cries as the lid is opened.)

#= Pharaoh's Daughter Bithiah
#speaker:Bithiah
#portrait:Bithiah_Neutral 
#layout:left 
#audio:Bithiah_mid
A Hebrew child...

#Miriam
#speaker:Miriam
#portrait:Miriam_Happy 
#layout:left 
#audio:Miriam_high
(excited but cautious)
My lady... do you wish for a nursemaid?

#= Pharaoh's Daughter Bithiah
#speaker:Bithiah
#portrait:Bithiah_Neutral 
#layout:left 
#audio:Bithiah_mid
(turns, startled)
Who are you, child?

+ "A Hebrew girl. I saw the basket floating and followed."
    -> honest
+ "A servant nearby. I thought you might need help."
    -> cautious
+ "Just someone who cares for little ones."
    -> evasive

=== honest ===
#= Pharaoh's Daughter Bithiah
#speaker:Bithiah
#portrait:Bithiah_Neutral 
#layout:left 
#audio:Bithiah_mid
You followed this child through the reeds?

#= Miriam =
Yes. He is... precious. He needs someone to care for him.

-> offer

=== cautious ===
#= Pharaoh's Daughter Bithiah
#speaker:Bithiah
#portrait:Bithiah_Neutral 
#layout:left 
#audio:Bithiah_mid
Well, you’re certainly quick to appear.

#= Miriam =
#speaker:Miriam
#portrait:Miriam_Happy 
#layout:left 
#audio:Miriam_high
Only because I knew someone had to help him.

-> offer

=== evasive ===
#= Pharaoh's Daughter Bithiah
#speaker:Bithiah
#portrait:Bithiah_Neutral 
#layout:left 
#audio:Bithiah_mid
That’s vague... but I admire your compassion.

-> offer

=== offer ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Happy 
#layout:left 
#audio:Miriam_high
Shall I fetch a Hebrew woman who can nurse him?

#= Pharaoh's Daughter Bithiah
#speaker:Bithiah
#portrait:Bithiah_Happy 
#layout:left 
#audio:Bithiah_high
Yes. Find one quickly. This child... he is not like the others. He was given to the river, and the river gave him back.

#Miriam
#speaker:Miriam
#portrait:Miriam_Happy 
#layout:left 
#audio:Miriam_high
I know someone — gentle, wise, and strong. She’ll raise him as if he were her own.

#= Pharaoh's Daughter Bithiah
#speaker:Bithiah
#portrait:Bithiah_Happy 
#layout:left 
#audio:Bithiah_high
Good. Then go. And tell her: he shall be called *Moses*, for I drew him out of the water.

-> END
