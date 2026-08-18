'use strict';

// Curated corpus of well-known programming aphorisms.
//
// ATTRIBUTION IS UNVERIFIED. The author on each entry is who the line is
// commonly credited to -- not an author checked against a primary source.
// Programming aphorisms are widely misattributed, and this corpus is not
// an exception: a risk-ranked triage of all 50 entries lives in
// docs/corpus-attribution-triage.md, which rates 8 of them HIGH risk.
// Read every author field as "commonly attributed to", and consult that
// document before repeating one of these as established fact.
//
// Each entry: { text: string, author: string, tags: string[] }
// Tags are lowercase single words.

const corpus = [
  {
    text: 'Premature optimization is the root of all evil.',
    author: 'Donald Knuth',
    tags: ['performance'],
  },
  {
    text: 'Beware of bugs in the above code; I have only proved it correct, not tried it.',
    author: 'Donald Knuth',
    tags: ['debugging', 'humor'],
  },
  {
    text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
    author: 'Martin Fowler',
    tags: ['readability', 'design'],
  },
  {
    text: 'There are only two hard things in computer science: cache invalidation and naming things.',
    author: 'Phil Karlton',
    tags: ['readability', 'performance'],
  },
  {
    text: 'Simplicity is prerequisite for reliability.',
    author: 'Edsger W. Dijkstra',
    tags: ['simplicity', 'reliability'],
  },
  {
    text: 'The competent programmer is fully aware of the strictly limited size of his own skull.',
    author: 'Edsger W. Dijkstra',
    tags: ['complexity', 'simplicity'],
  },
  {
    text: 'If debugging is the process of removing software bugs, then programming must be the process of putting them in.',
    author: 'Edsger W. Dijkstra',
    tags: ['debugging', 'humor'],
  },
  {
    text: 'Testing shows the presence, not the absence, of bugs.',
    author: 'Edsger W. Dijkstra',
    tags: ['debugging'],
  },
  {
    text: 'Elegance is not a dispensable luxury but a quality that decides between success and failure.',
    author: 'Edsger W. Dijkstra',
    tags: ['simplicity', 'design'],
  },
  {
    text: 'The question of whether computers can think is like the question of whether submarines can swim.',
    author: 'Edsger W. Dijkstra',
    tags: ['philosophy', 'humor'],
  },
  {
    text: 'Computer science is no more about computers than astronomy is about telescopes.',
    author: 'Edsger W. Dijkstra',
    tags: ['philosophy'],
  },
  {
    text: 'Controlling complexity is the essence of computer programming.',
    author: 'Brian Kernighan',
    tags: ['complexity'],
  },
  {
    text: 'Debugging is twice as hard as writing the code in the first place. Therefore, if you write the code as cleverly as possible, you are, by definition, not smart enough to debug it.',
    author: 'Brian Kernighan',
    tags: ['debugging', 'simplicity'],
  },
  {
    text: 'The most effective debugging tool is still careful thought, coupled with judiciously placed print statements.',
    author: 'Brian Kernighan',
    tags: ['debugging'],
  },
  {
    text: 'There are two ways of constructing a software design: one way is to make it so simple that there are obviously no deficiencies, and the other way is to make it so complicated that there are no obvious deficiencies.',
    author: 'C.A.R. Hoare',
    tags: ['simplicity', 'design'],
  },
  {
    text: 'I call it my billion-dollar mistake. It was the invention of the null reference.',
    author: 'C.A.R. Hoare',
    tags: ['reliability', 'language'],
  },
  {
    text: 'Adding manpower to a late software project makes it later.',
    author: 'Fred Brooks',
    tags: ['teamwork'],
  },
  {
    text: 'The bearing of a child takes nine months, no matter how many women are assigned.',
    author: 'Fred Brooks',
    tags: ['teamwork', 'humor'],
  },
  {
    text: 'All programmers are optimists.',
    author: 'Fred Brooks',
    tags: ['humor', 'teamwork'],
  },
  {
    text: 'Plan to throw one away; you will, anyhow.',
    author: 'Fred Brooks',
    tags: ['design', 'process'],
  },
  {
    text: "A language that doesn't affect the way you think about programming is not worth knowing.",
    author: 'Alan Perlis',
    tags: ['language'],
  },
  {
    text: 'Simplicity does not precede complexity, but follows it.',
    author: 'Alan Perlis',
    tags: ['simplicity', 'complexity'],
  },
  {
    text: 'It is better to have 100 functions operate on one data structure than 10 functions on 10 data structures.',
    author: 'Alan Perlis',
    tags: ['design'],
  },
  {
    text: 'If you have a procedure with 10 parameters, you probably missed some.',
    author: 'Alan Perlis',
    tags: ['design', 'humor'],
  },
  {
    text: 'Optimization hinders evolution.',
    author: 'Alan Perlis',
    tags: ['performance'],
  },
  {
    text: 'Be conservative in what you send, be liberal in what you accept.',
    author: 'Jon Postel',
    tags: ['reliability'],
  },
  {
    text: 'Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations.',
    author: 'Melvin Conway',
    tags: ['design', 'teamwork'],
  },
  {
    text: 'Make it work, make it right, make it fast.',
    author: 'Kent Beck',
    tags: ['process', 'performance'],
  },
  {
    text: "I'm not a great programmer; I'm just a good programmer with great habits.",
    author: 'Kent Beck',
    tags: ['process'],
  },
  {
    text: 'Do the simplest thing that could possibly work.',
    author: 'Ward Cunningham',
    tags: ['simplicity'],
  },
  {
    text: "Focus is a matter of deciding what things you're not going to do.",
    author: 'John Carmack',
    tags: ['simplicity'],
  },
  {
    text: 'Talk is cheap. Show me the code.',
    author: 'Linus Torvalds',
    tags: ['process'],
  },
  {
    text: 'Bad programmers worry about the code. Good programmers worry about data structures and their relationships.',
    author: 'Linus Torvalds',
    tags: ['design'],
  },
  {
    text: 'Fancy algorithms are slow when n is small, and n is usually small.',
    author: 'Rob Pike',
    tags: ['performance'],
  },
  {
    text: 'The bigger the interface, the weaker the abstraction.',
    author: 'Rob Pike',
    tags: ['design', 'complexity'],
  },
  {
    text: 'A little copying is better than a little dependency.',
    author: 'Rob Pike',
    tags: ['design'],
  },
  {
    text: 'Clear is better than clever.',
    author: 'Rob Pike',
    tags: ['readability', 'simplicity'],
  },
  {
    text: 'Errors are values.',
    author: 'Rob Pike',
    tags: ['reliability', 'design'],
  },
  {
    text: 'All problems in computer science can be solved by another level of indirection.',
    author: 'David Wheeler',
    tags: ['complexity', 'design'],
  },
  {
    text: "It's easier to ask forgiveness than it is to get permission.",
    author: 'Grace Hopper',
    tags: ['teamwork'],
  },
  {
    text: "The most dangerous phrase in the language is, 'We've always done it this way.'",
    author: 'Grace Hopper',
    tags: ['teamwork'],
  },
  {
    text: 'Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.',
    author: 'Antoine de Saint-Exupéry',
    tags: ['simplicity', 'design'],
  },
  {
    text: "You aren't gonna need it.",
    author: 'Ron Jeffries',
    tags: ['simplicity'],
  },
  {
    text: 'Given enough eyeballs, all bugs are shallow.',
    author: 'Eric S. Raymond',
    tags: ['debugging', 'teamwork'],
  },
  {
    text: 'Code is read much more often than it is written.',
    author: 'Guido van Rossum',
    tags: ['readability'],
  },
  {
    text: 'C makes it easy to shoot yourself in the foot; C++ makes it harder, but when you do, it blows away your whole leg.',
    author: 'Bjarne Stroustrup',
    tags: ['humor', 'language'],
  },
  {
    text: 'There are only two kinds of languages: the ones people complain about and the ones nobody uses.',
    author: 'Bjarne Stroustrup',
    tags: ['humor', 'language'],
  },
  {
    text: 'Simple things should be simple, complex things should be possible.',
    author: 'Alan Kay',
    tags: ['simplicity', 'design'],
  },
  {
    text: 'The best way to predict the future is to invent it.',
    author: 'Alan Kay',
    tags: ['philosophy'],
  },
  {
    text: "It's not a bug, it's an undocumented feature.",
    author: 'Anonymous',
    tags: ['humor', 'debugging'],
  },
];

module.exports = { corpus };
