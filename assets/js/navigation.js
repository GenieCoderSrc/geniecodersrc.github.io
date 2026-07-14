const menuButton =
    document.querySelector(".menu-button");

const navigation =
    document.querySelector(".navigation");

if(menuButton){

    menuButton.addEventListener("click",()=>{

        navigation.classList.toggle("open");

    });

}
