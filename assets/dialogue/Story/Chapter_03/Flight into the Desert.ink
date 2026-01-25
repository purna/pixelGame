
-> start

INCLUDE ../Global.ink
INCLUDE ../Functions.ink

=== start ===

+ <b>Flight into the Desert - Moses' Escape</b>


-> aftermath

=== aftermath ===
#= Moses =
#speaker:Moses
#portrait:Moses_Sad
#layout:left 
#audio:Moses_low
(breathing hard)
What have I done...?

{pause}
(The body of the Egyptian lies half-covered in sand.)

#= Miriam =
#speaker:Miriam
#portrait:Miriam_Sad
#layout:left 
#audio:Miriam_low
Moses! You shouldn’t have come back here.

#= Moses =
#speaker:Moses
#portrait:Moses_Neutral 
#layout:left 
#audio:Moses_mid
I had to see if anyone—

#= Miriam =
#speaker:Miriam
#portrait:Miriam_Sad
#layout:left 
#audio:Miriam_low
Everyone *knows*. The rumors spread faster than sand.

+ "I only meant to stop him. He was beating a man nearly to death."
    -> regret
+ "I lost control. I saw red."
    -> rage
+ "He was evil. He deserved it."
    -> justification

=== regret ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Sad
#layout:left 
#audio:Miriam_low
Your heart was right. But Pharaoh doesn’t see hearts — only threats.

-> warning

=== rage ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Sad
#layout:left 
#audio:Miriam_low
Your anger isn’t a crime, Moses. But taking a life in Pharaoh’s city is.

-> warning

=== justification ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Sad
#layout:left 
#audio:Miriam_low
Even justice has a price, brother. And Pharaoh always collects.

-> warning

=== warning ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Sad
#layout:left 
#audio:Miriam_low
You must leave. Now. Pharaoh wants you dead.

#= Moses =
#speaker:Moses
#portrait:Moses_Sad
#layout:left 
#audio:Moses_low
I don’t know where to go. I’ve never stepped beyond the Nile’s reach.

+ "I’ll go to the Hebrews. Maybe they’ll hide me."
    -> rejected
+ "Into the desert, then. Anywhere but here."
    -> desert
+ "I could go to Pharaoh... confess. Try to make it right."
    -> confession

=== rejected ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Sad
#layout:left 
#audio:Miriam_low
They call you ‘prince.’ They don’t trust you — not yet.

#= Moses =
#speaker:Moses
#portrait:Moses_Sad
#layout:left 
#audio:Moses_low
Then I am too Hebrew for the palace, and too Egyptian for the slaves.

-> desert_path

=== confession ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Sad
#layout:left 
#audio:Miriam_low
No! Pharaoh sees your act as rebellion. There is no pardon waiting in his court.

#= Moses =
#speaker:Moses
#portrait:Moses_Sad
#layout:left 
#audio:Moses_low
Then I have no choice.

-> desert_path

=== desert ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Sad
#layout:left 
#audio:Miriam_low
Take what you can. Water. Bread. And your staff. The desert won’t be merciful.

#= Moses =
#speaker:Moses
#portrait:Moses_Neutral 
#layout:left 
#audio:Moses_mid
Nor was Egypt.

-> desert_path

=== desert_path ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Happy
#layout:left 
#audio:Miriam_high
Wherever you go… listen. Not just with your ears — with your soul.

#= Moses =
#speaker:Moses
#portrait:Moses_Neutral 
#layout:left 
#audio:Moses_mid
I don’t know who I am anymore.

#= Miriam =
#speaker:Miriam
#portrait:Miriam_Happy
#layout:left 
#audio:Miriam_high
Then perhaps the wilderness will show you.

{pause}
#= Moses =
#speaker:Moses
#portrait:Moses_Sad 
#layout:left 
#audio:Moses_low
Farewell, Miriam.

#= Miriam =
#speaker:Miriam
#portrait:Miriam_Happy
#layout:left 
#audio:Miriam_high
Go with God, brother. The same God who watched you in the river now walks with you into the sand.

-> END
