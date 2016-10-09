	@extends('layouts.app')


	@section('content')
	
	<h4 class="page-header">
		<a href="{{ route('posts.create') }}" class="btn btn-primary">
			새글쓰기
		</a>
	</h4>
		<ul>
		@foreach ($posts as $post)
			<li>
				<a href="/posts/{{ $post->id }}">{{ $post->title }}</a>
				<small>
					{{ $post->name }}
				</small>
			</li>
		@endforeach
		</ul>
		
		<div class="text-center">
			{!! $posts->render() !!}
		</div>
	@endsection