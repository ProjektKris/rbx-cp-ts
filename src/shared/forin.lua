function forin(t, callback)
	for k, v in pairs(t) do
		callback(k, v)
	end
end
return { forin }
