<?php
class DuvidasController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function criar() {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw);
        
        if ($data === null) {
            http_response_code(400);
            echo json_encode(["message" => "Erro ao processar os dados enviados."]);
            return;
        }

        if (empty($data->nome) || empty($data->email) || empty($data->tipo) || empty($data->mensagem)) {
            http_response_code(400);
            echo json_encode(["message" => "Preencha todos os campos obrigatórios."]);
            return;
        }

        $duvida = new Duvida($this->db);
        $duvida->nome = $data->nome;
        $duvida->email = $data->email;
        $duvida->tipo = $data->tipo;
        $duvida->mensagem = $data->mensagem;

        if ($duvida->create()) {
            http_response_code(201);
            echo json_encode(["message" => "Mensagem enviada com sucesso!"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao enviar a mensagem."]);
        }
    }
}
?>
