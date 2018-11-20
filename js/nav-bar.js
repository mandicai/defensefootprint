d3.select('.mobile-icon').on('click', function () {
  mobileMenuToggle()
})

function mobileMenuToggle () {
  let navs = document.querySelectorAll('.nav-links')
  navs.forEach(nav => nav.classList.toggle('nav-links-show'))
}
