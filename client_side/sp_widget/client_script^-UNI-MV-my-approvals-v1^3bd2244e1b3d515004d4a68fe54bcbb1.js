function ($scope, spUtil, spUIActionsExecuter) {
	var c = this;

	c.approvals = c.data.approvals.map(function (app) {
		app.valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.valor)

		if (!!app.items) {
			app.items = app.items.map(function (item) {
				item.preco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco)
				item.total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)

				return item;
			})
		}
		return app
	})

	c.filteredApprovals = c.approvals;

	c.approver = function (action, sys_id, comment) {
		c.loading = sys_id
		c.server.get({
			action: action,
			sys_id: sys_id,
			comment: comment
		}).then(function (response) {
		});

		c.server.update().then(function (response) {
			c.approvals = c.data.approvals.map(function (app) {
				app.valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.valor)

				if (app.items) {
					app.items = app.items.map(function (item) {
						item.preco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco)
						item.total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)

						return item;
					})
				}

				return app
			})

			if (action === "approve") {
				spUtil.addInfoMessage("Sua ordem de número: " + number + " foi aprovada");
			}

			if (action === "reject") {
				spUtil.addInfoMessage("Sua ordem de número: " + number + " foi rejeitada");
			}
		});
	}

	c.update = function () {
		c.data.action = "u_update"

		$scope.data.loading = true;
		$scope.data.enabledUpdate = false;

		setTimeout(function () {
			$scope.data.loading = false;
			$scope.data.enabledUpdate = true;
		}, 116000);

		c.server.update().then(function (response) {
			setTimeout(function () {
				window.location.reload(false);
			}, 116000)
		});
	}

	c.data.counter = c.filteredApprovals.length;

	c.data.query = "";

	c.filter = function () {
		console.log(c.approvals)
		c.filteredApprovals = c.approvals.filter(function (approval) {
			if (approval.number.includes(c.data.query))
				return approval;
			if (approval.fornecedor !== null)
				if (approval.fornecedor.includes(c.data.query))
					return approval;
			if (approval.number_oc_sc.includes(c.data.query))
				return approval;
		})
		c.data.counter = c.filteredApprovals.length;
	}

	c.data.currentItems = 5;
	c.showMore = function () {
		var showMoreButton = document.querySelector("button.show-more")
		var approvalsElementList = document.querySelectorAll(".approval-item");

		for (var i = c.data.currentItems; i < c.data.currentItems + 53; i++) {
			if (approvalsElementList[i]) {
				approvalsElementList[i].style.display = 'flex';
			}
		}
		c.data.currentItems += 5;
		if (c.data.currentItems >= approvalsElementList.length) {
			showMoreButton.classList.add('loaded')
		}
	}

	console.log(c.approvals)
}