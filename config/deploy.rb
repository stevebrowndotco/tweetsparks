#require 'capistrano/chef'
set :application, "node-twitter"
set :repository,  "git@github.com:theaudiencecom/node-twitter.git"
set :deploy_to, "/home/sites/nodetwitter/node-twitter"


set :normalize_asset_timestamps, false

set :keep_releases, 4

set :user, "deploy"
set :use_sudo, false
#set :ssh_options, {:forward_agent => true}
ssh_options[:forward_agent] = true
default_run_options[:pty] = true

set :scm, :git # You can set :scm explicitly or Capistrano will make an intelligent guess based on known version control directory names
# Or: `accurev`, `bzr`, `cvs`, `darcs`, `git`, `mercurial`, `perforce`, `subversion` or `none`
set :deploy_via, :remote_cache

task :production do
#  chef_role :web, 'roles:generalweb', :attribute => Proc.new { |n| n['ec2']['public_hostname'] }
  role :web, "107.21.132.176"                          # Your HTTP server, Apache/etc
end 

# if you want to clean up old releases on each deploy uncomment this:
after "deploy:restart", "deploy:cleanup"

# if you're still using the script/reaper helper you will need
# these http://github.com/rails/irs_process_scripts
