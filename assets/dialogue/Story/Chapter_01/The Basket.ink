
-> start

INCLUDE ../Global.ink
INCLUDE ../Functions.ink


=== start ===

+ <b>The Basket - Miriam & Jocheved</b>

-> morning

=== morning ===
#Jocheved
#speaker:Jocheved
#portrait:Jocheved_Neutral 
#layout:left 
#audio:Jocheved_mid

Miriam, come inside. Close the curtain. We mustn't let the neighbors see.

#Miriam
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
Why are you crying, Mama?

#Jocheved
#speaker:Jocheved
#portrait:Jocheved_Sad 
#layout:left 
#audio:Jocheved_low
(shakily)
The soldiers came to our neighbor’s house. Their newborn... they took him.

#Miriam
#speaker:Miriam
#portrait:Miriam_Sad 
#layout:left 
#audio:Miriam_low
(tensed)
No. Not again. When will Pharaoh stop?

#Jocheved
#speaker:Jocheved
#portrait:Jocheved_Sad 
#layout:left 
#audio:Jocheved_low
He won’t. He fears our numbers. So he sends his fear into our homes — through our sons.

+ "What will we do when our baby comes?"
    -> fear
+ "We have to run. Hide him somewhere far!"
    -> hide
+ "We could plead to Pharaoh’s daughter..."
    -> plead

=== fear ===
#speaker:Jocheved
#portrait:Jocheved_neutral 
#layout:left 
#audio:Jocheved_mid
I pray. I hope. I don't know. But we must be ready.

-> decision


=== hide ===
#Jocheved
#speaker:Jocheved
#portrait:Jocheved_neutral 
#layout:left 
#audio:Jocheved_mid
And where would we go that Pharaoh’s reach does not follow?

-> decision

=== plead ===
#Jocheved
#speaker:Jocheved
#portrait:Jocheved_sad 
#layout:left 
#audio:Jocheved_mid
Pleading to Pharaoh’s daughter would be like whispering to a stone. She is his blood.

-> decision

=== decision ===
#Miriam
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
I’ve been thinking, Mama... the reeds by the Nile. The water moves slowly there.

#Jocheved
#speaker:Jocheved
#portrait:Jocheved_neutral 
#layout:left 
#audio:Jocheved_mid
The Nile?

#Miriam
#speaker:Miriam
#portrait:Miriam_Happy 
#layout:left 
#audio:Miriam_high
We could build a basket. Hide him in plain sight — but safely. You weave... like no one else.

+ "Will you help me make it?"
    -> basket

=== basket ===
#Jocheved
#speaker:Jocheved
#portrait:Jocheved_sad 
#layout:left 
#audio:Jocheved_mid
(tears welling)
Yes. My hands may tremble, but I will weave. I will weave with hope, not fear.

#Miriam
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
And I’ll watch him. I’ll stand hidden nearby.

#Jocheved
#speaker:Jocheved
#portrait:Jocheved_Happy 
#layout:left 
#audio:Jocheved_mid
You are brave, my daughter.

-> END
