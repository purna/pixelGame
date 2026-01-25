
->start

INCLUDE ../Global.ink
INCLUDE ../Functions.ink

=== start ===

+ <b>The Hidden Name - Miriam & Moses</b>

-> garden

=== garden ===
#= Moses =
#speaker:Moses
#portrait:Moses_Happy 
#layout:left 
#audio:Moses_high
Miriam… I saw them today. My people — our people.

#Miriam
#speaker:Miriam
#portrait:Miriam_Happy 
#layout:left 
#audio:Miriam_high
Yes, Moses. I wondered when you would.

#= Moses =
#speaker:Moses
#portrait:Moses_Sad
#layout:left 
#audio:Moses_low
They toil in the sun like beasts. Beaten. Shamed. While I sit in Pharaoh's halls, robed in gold.

+ "Why didn’t anyone tell me I was Hebrew?"
    -> truth
+ "You knew, didn’t you?"
    -> confrontation
+ "I feel like a stranger to both worlds."
    -> torn

=== truth ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
Mother hid you because she loved you. We all did. It was the only way to save you.

-> identity

=== confrontation ===
#Miriam
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
I did. I watched you grow in her arms… and then in theirs.

#= Moses =
#speaker:Moses
#portrait:Moses_Sad 
#layout:left 
#audio:Moses_low
All this time... you were near?

#= Miriam =
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
Always.

-> identity

=== torn ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
You're not alone. Every Hebrew walks between fear and faith every day.

-> identity

=== identity ===
#= Moses =
#speaker:Moses
#portrait:Moses_Sad 
#layout:left 
#audio:Moses_low
The guards struck a man for falling under a stone. I wanted to scream — to stop it. But my hands... they froze.

#= Miriam =
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
Your heart moved. That’s more than many born to royalty.

#= Moses =
#speaker:Moses
#portrait:Moses_Happy 
#layout:left 
#audio:Moses_high
Then who am I, truly?

+ "Am I Pharaoh’s son?"
    -> pharaoh_son
+ "Or am I a slave’s brother?"
    -> slave_brother

=== pharaoh_son ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
You are a prince by chance, and a Hebrew by birth. But your soul must choose its own title.

-> path

=== slave_brother ===
#= Miriam =
#speaker:Miriam
#portrait:Miriam_Happy 
#layout:left 
#audio:Miriam_high
You are the son of Jocheved, the brother of Aaron, and mine. That is not shame — that is strength.

-> path

=== path ===
#= Moses =
#speaker:Moses
#portrait:Moses_Happy 
#layout:left 
#audio:Moses_high
The palace gave me a name. But the cries of my people... they give me purpose.

#= Miriam =
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
Then perhaps that’s what God was waiting for.

#= Moses =
#speaker:Moses
#portrait:Moses_Happy 
#layout:left 
#audio:Moses_high
Tell Mother I remember her arms. Her song. Her strength.

#= Miriam =
#speaker:Miriam
#portrait:Miriam_Neutral 
#layout:left 
#audio:Miriam_mid
She’ll weep to hear it. And one day, brother… they will sing your name in freedom.

-> END
