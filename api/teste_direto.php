<?php
header("Content-Type: application/json");
require_once 'config/database.php';
require_once 'models/Usuario.php';

$db = (new Database())->getConnection();
$usuario = new Usuario($db);
$usuario->nome = "Teste Direto";
$usuario->email = "teste_direto@email.com";
$usuario->senha = "123456";
$usuario->plano = "Gratuito";

if ($usuario->create()) {
    echo json_encode(["status" => "ok", "id" => $usuario->id_usuario]);
} else {
    echo json_encode(["status" => "erro", "msg" => "Falha no insert"]);
}
?>