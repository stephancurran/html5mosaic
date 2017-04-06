I was looking at a mosaic in the Roman ruins of Italica, near Seville, and I thought it would be cool to be able to design one with an app. While software exists to design mosaics professionally (and even make them with machines), I just wanted something simple that you could play with for fun. As I haven't programmed in a number of years, I just started playing around with JS and the HTML5 canvas, as this required very little setup on my part.

The initial idea was to add square tiles which could be moved, rotated, and cut. As I played around with things, I got more ideas (such as multiple tile selection, random tile shapes, saving/loading, etc.). This approach had the big disadvantage that more than once, I had to go back and refactor large portions of code in order to make a new feature work better. However, I took these as learning opportunities.

I'm pretty happy with the end result, but if anyone has any suggestions or spots a bug, please let me know.

I used JQuery for a few things like resizing the canvas, but the rest is raw JS.

Tiles contain vertices as an array: [x0,y0, x1,y1, x2,y2 ... ], their colour as a hex string, an image reference if applicable, and a couple of other internal necesseties.

Vertex manipulation is done by passing the vertex array of the tile and changing it directly; either with the difference between the current and previous mouse position, or in the case of flipping, by calculating the centroid of the selected tiles and flipping across that.