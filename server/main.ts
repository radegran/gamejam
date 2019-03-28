const express = require( "express" );
const path = require("path");
const app = express();
const port = process.env.PORT || 8080; // default port to listen

app.use( express.static( path.join( __dirname, "../dist" ) ) );

// define a route handler for the default home page
// app.get( "/", ( req, res ) => {
//     res.send( "Hello world!" );
// } );

// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );