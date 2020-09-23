require 'digest'
require 'byebug'

md5 = Digest::MD5
$_hexdigest = md5.method(:hexdigest)

def md5.hexdigest(*args)
  puts "MD5.hexdigest CALLED"
  puts caller[0..2]
  $_hexdigest.call(*args)
end
