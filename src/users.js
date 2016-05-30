'use strict';

var sqlite = require('sqlite3').verbose();

var db = new sqlite.Database(
	`${ROOT_DIR}/db/bot.sqlite`,
	sqlite.OPEN_READWRITE,
	function() {
		console.log('DB', arguments);
	}
);

class UsersError extends Error {

}

class User {
	_insert(id, name) {
		let self = this;

		return new Promise((resolve, reject) => {
			db.serialize(() => {
				db.run('insert into users (t_id, name) values ($id, $name)',
					{
						$id: id,
						$name: name
					},
					function (error) {
						console.trace(error);
						if (error) {
							reject(error);
						} else {
							self.get(this.changes.t_id)
								.then(user => resolve(user));
						}
					});
			});
		});
	}

	reg(id, name) {
		return this.get(id)
			.then((user) => {
				if (user) {
					throw new UsersError('Такой пользователь уже существует');
				} else {
					return this._insert(id, name);
				}
			})
	}

	get(id) {
		return new Promise((resolve, reject) => {
				db.serialize(() => {
					db.get('select * from users where t_id = $id',
						{$id: id},
						(error, user) => {
							if (error) {
								reject(error);
							} else {
								resolve(user);
							}
						}
					);
				});
			});
	}
}

module.exports = new User();
