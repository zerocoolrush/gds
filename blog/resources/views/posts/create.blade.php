<form method="post" action="{{ route('posts.store') }}">
	{!! csrf_field() !!}
	
	
	@include('posts.partial.form')
	
	<div class="form-group text-center">
		<button type="submit" class="btn btn-primary">Post</button>
	</div>

</form>