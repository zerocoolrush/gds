<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Post;
use App\Http\Requests\PostRequest;

class PostsController extends Controller
{
	
	public function __construct()
	{
		$this->middleware('auth', ['except'=>['index','show']]);
	}
    
	public function index(Post $post)
	{
		$post->load('user');
		return view('posts.show',compact('posts'));
	}
	
    public function show(Post $post)
    {
    	$post->load('user');
    	return view('posts.show',compact('posts'));
    }
    
    public function create()
    {
    	$posts = new post;
    	
    	return view('posts.show',compact('posts'));
    }
    public function store(PostRequest $request)
    {
    	$post = $request->$user()->posts()->create($request->all());
    	
    	return redirect(route('posts.sho'));
    	
    }
    public function edit(Post $post)
    {
    	$this->authorize('update',$post);
    }

}
