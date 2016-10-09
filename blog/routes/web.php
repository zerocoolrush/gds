<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of the routes that are handled
| by your application. Just tell Laravel the URIs it should respond
| to using a Closure or controller method. Build something great!
|
*/


Route::get('/', function () {
    return view('welcome');
});

Route::get('posts', function() {
	$posts = App\Post::with('user')->paginate(10);

	return view('posts.index', compact('posts'));
});

Route::get('mail', function() {
	$to = 'YOUR@EMAIL.ADDRESS';
	$subject = 'Studying sending email in Laravel';
	$data = [
			'title' => 'Hi there',
			'body'  => 'This is the body of an email message',
			'user'  => App\User::find(1)
	];

	return Mail::send('emails.welcome', $data, function($message) use($to, $subject) {
		$message->to($to)->subject($subject);
	});
});