
	=== function pop(ref _list) 
    ~ temp el = LIST_MIN(_list) 
    ~ _list -= el
    ~ return el 
    
    
/*
	Quick random function for varying choices

	Usage: 

		*	{maybe()} [Ask about apples]
		*	{maybe()} [Ask about oranges]
		*	{maybe()} [Ask about bananas]
		

*/

=== function alternative(list)
~ return RANDOM(0, 2) == 0


=== function maybe(list)
	~ return RANDOM(1, 3) == 1

/*
	Converts text to uppercase. Doesn't have an inky fallback.

	Usage: 

	"Give me wine. {UPPERCASE("Give me wine!")}
	
	Required C# code:

	The external binding is as follows.

		story.BindExternalFunction("UPPERCASE", (string txt) =>
	    {
	        return txt.ToUpper();
	    });
		
*/

EXTERNAL UPPERCASE(txt)
=== function UPPERCASE(txt)
    {txt}
	

/*

	Overview: 

	A system for tracking "good and bad" actions, and returning the proportion the player has encountered in the course of their playthrough. 

	e.g. the player has said 15 nice things and 5 nasty things, so they are 75% nice.

	This allows the game to make decisions about the balance of the player's choices across the game regardless of knowing how many choice moments they've actually encountered. 

	It also means that the player's behaviour settles over time - each additional decision they take has less and less effect on the overall value. In short, "what's done is done."


	System:

	Each concept is given a "swing variable", which after being given an initial value, can be "raised" or "lowered".

	For more significant actions, one can "elevate" or "ditch" it. For all-but-irrecoverable actions, you can "escalate" or "demolish" the stat.

	To test the variable, the following queries are provided: "high", "up", "mid", "down", "low".

	Note that the system won't return a "up" or "down" result until the player has taken a few choices to seed the system.


	Usage:

	// initialise the variable
	VAR niceness = INITIAL_SWING

	// alter the variable
	~ raise(niceness) 		// note a nice choice
	~ lower(niceness)		// note a nasty choice 

	// test the variable
	I'm <>
	{ 
	- up(niceness):
		nice 
	- down(niceness):
		nasty 
	- else: 
		undecided 
	} 
	<>.


*/

 === function lower(ref x)
 	~ x = x - 1

 === function raise(ref x)
 	~ x = x + 1
 	
 	

CONST INITIAL_SWING = 1001

=== function swing_count(x) 
    ~ return (upness(x) + downness(x)) - 2

=== function swing_ready(x) 
    ~ return swing_count(x) >= 2



=== function elevate(ref x)
    ~ raise(x)
    ~ raise(x)
    ~ raise(x)


== function ditch (ref x) 
    ~ lower(x) 
    ~ lower(x) 
    ~ lower(x)

=== function demolish(ref x)
    ~ x = x + 20
    
=== function escalate(ref x)
    ~ x = x + (20 * 1000)

	

=== function upness(x)
	~ return x / 1000

=== function downness(x)
	~ return x % 1000


=== function high(x)
    ~ return (1 * upness(x) >= downness(x) * 9)

=== function up(x)
	~ return swing_ready(x) && (4 * upness(x) >= downness(x) * 6)

=== function down(x)
	~ return swing_ready(x) && (6 * upness(x) <= downness(x) * 4)
	
=== function low(x)
	~ return swing_ready(x) && (9 * upness(x) <= downness(x) * 1)
	
=== function mid(x)
    // If the swing isn't ready this returns true 
    // Because "up is false and down is false"
    ~ return (not up(x) && not down(x))



=== function came_from(-> x) 
    ~ return TURNS_SINCE(x) == 0
    
    
//
// System: inventory
//

LIST Inventory = (none), cane, knife

=== function get(x)
    ~ Inventory += x

//
// System: positioning things
// Items can be put in and on places
//

LIST Supporters = on_desk, on_floor, on_bed, under_bed, held, with_joe

=== function move_to_supporter(ref item_state, new_supporter) ===
    ~ item_state -= LIST_ALL(Supporters)
    ~ item_state += new_supporter


    
