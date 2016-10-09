	@extends('layouts.app')
	
	@section('content')
	<article>
		<div class="box-meta">
			{{ $post->created_at->diffForHumans() }}
		</div>
		{{$post->content}}
	</article>
	
	<div class="box-control">
		<a href="{{route('posts.index')}}" class="btn btn-default">
			���
		</a>
		<a href="{{route('posts.edit')}}" class="btn- btn-warning">
			����
		</a>
		<button class="btn btn-danger" id="delete-post">
			����
		</button>
	</div>
	@endsection