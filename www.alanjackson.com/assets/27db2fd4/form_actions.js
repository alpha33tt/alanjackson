/**
 * Created by dmitry on 08.07.16.
 */

function replaceForm(formId, data)
{
    $(formId).parent().replaceWith(data);
}

function showModalResult(data)
{
    if (typeof data === 'string') {
        pageObject = JSON.parse(data);
    }
    else {
        pageObject = data;
    }

    modalWindow = $('div#modalResult');

    modalWindow.find('.modal-body').html(pageObject.html);
    modalWindow.find('.modal-header').html(pageObject.title);

    modalWindow.modal()
}

function lockSubmitButtons(formName) {
    $('#form_' + formName + ' input[type="submit"]').attr('disabled', 'disabled');
    $('#form_' + formName + ' span.submit-spinner').addClass('fa fa-refresh fa-spin');
    $('#form_' + formName + ' span.submit-spinner').show();

    $('#form_' + formName + ' button[type="submit"]').attr('disabled', 'disabled');
    $('#form_' + formName + ' button[type="submit"] i').addClass('fa fa-refresh fa-spin');
}

function unlockSubmitButtons(formName) {
    $('#form_' + formName + ' input[type="submit"]').removeAttr('disabled');
    $('#form_' + formName + ' span.submit-spinner').removeClass('fa fa-refresh fa-spin');
    $('#form_' + formName + ' span.submit-spinner').hide();

    $('#form_' + formName + ' button[type="submit"]').removeAttr('disabled');
    $('#form_' + formName + ' button[type="submit"] i').removeClass('fa fa-refresh fa-spin');
}

function resetValidators(formName)
{
    for (var prop in window) {
        if (prop.indexOf('executed_' + formName) == 0) {// check the prefix
            eval('window.' +prop +'= undefined;');
        }
    }
}

function hideBackdrop() {
    $('.modal-backdrop.fade.in').remove();
}