# Extra user for the impersonate scenarios: a locked account, which must not be impersonated.
User.current = User.find_by!(login: 'admin')
user = User.find_by(login: 'locked') ||
       User.new(login: 'locked', firstname: 'Locked', lastname: 'E2E', mail: 'locked@example.net')
user.password = user.password_confirmation = ENV['RMP_USER_PASSWORD'] || ENV['RMP_ADMIN_PASSWORD'] || 'Redmine7Test!'
user.must_change_passwd = false
user.status = User::STATUS_LOCKED
user.save!
