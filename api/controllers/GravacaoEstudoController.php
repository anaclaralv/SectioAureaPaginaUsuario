<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

class GravacaoEstudoController {
    private $gravacao;
    private $id_usuario_logado;
    
    public function __construct($db, $id_usuario_logado = null) {
        $this->gravacao = new GravacaoEstudo($db);
        $this->id_usuario_logado = $id_usuario_logado;
    }
    
    private function getUserId() {
        if(!$this->id_usuario_logado) {
            http_response_code(401);
            echo json_encode(["message" => "Usuário não autenticado"]);
            exit();
        }
        return $this->id_usuario_logado;
    }
    
    public function listar() {
        $id_usuario = $this->getUserId();
        $stmt = $this->gravacao->read($id_usuario);
        
        $gravacoes = [];
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['check_palavras_simples'] = (bool)$row['check_palavras_simples'];
            $row['check_analogias'] = (bool)$row['check_analogias'];
            $row['check_lacunas'] = (bool)$row['check_lacunas'];
            $row['check_simplificado'] = (bool)$row['check_simplificado'];
            $row['duracao'] = (int)$row['duracao'];
            
            // Aliases para camelCase do frontend
            $row['checkPalavrasSimples'] = $row['check_palavras_simples'];
            $row['checkAnalogias'] = $row['check_analogias'];
            $row['checkLacunas'] = $row['check_lacunas'];
            $row['checkSimplificado'] = $row['check_simplificado'];
            
            array_push($gravacoes, $row);
        }
        
        echo json_encode($gravacoes);
    }
    
    public function buscar($id) {
        $id_usuario = $this->getUserId();
        $this->gravacao->id_gravacao = $id;
        $this->gravacao->id_usuario = $id_usuario;
        
        if($this->gravacao->readOne()) {
            $cps = (bool)$this->gravacao->check_palavras_simples;
            $ca = (bool)$this->gravacao->check_analogias;
            $cl = (bool)$this->gravacao->check_lacunas;
            $cs = (bool)$this->gravacao->check_simplificado;
            
            echo json_encode([
                "id_gravacao" => $this->gravacao->id_gravacao,
                "id_usuario" => $this->gravacao->id_usuario,
                "data" => $this->gravacao->data,
                "url" => $this->gravacao->url,
                "modo" => $this->gravacao->modo,
                "nome" => $this->gravacao->nome,
                "check_palavras_simples" => $cps,
                "checkPalavrasSimples" => $cps,
                "check_analogias" => $ca,
                "checkAnalogias" => $ca,
                "check_lacunas" => $cl,
                "checkLacunas" => $cl,
                "check_simplificado" => $cs,
                "checkSimplificado" => $cs,
                "anotacoes" => $this->gravacao->anotacoes,
                "duracao" => (int)$this->gravacao->duracao
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Gravação não encontrada"]);
        }
    }
    
    public function criar() {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        if(empty($data->url) || empty($data->modo)) {
            http_response_code(400);
            echo json_encode(["message" => "URL e Modo são obrigatórios"]);
            return;
        }
        
        $this->gravacao->id_usuario = $id_usuario;
        
        $data_gravacao = $data->data ?? date('Y-m-d H:i:s');
        $timestamp = strtotime($data_gravacao);
        $this->gravacao->data = ($timestamp !== false) ? date('Y-m-d H:i:s', $timestamp) : date('Y-m-d H:i:s');
        
        $this->gravacao->url = $data->url;
        $this->gravacao->modo = $data->modo;
        $this->gravacao->nome = $data->nome ?? 'Minha Gravação';
        $this->gravacao->check_palavras_simples = isset($data->checkPalavrasSimples) ? (int)$data->checkPalavrasSimples : 0;
        $this->gravacao->check_analogias = isset($data->checkAnalogias) ? (int)$data->checkAnalogias : 0;
        $this->gravacao->check_lacunas = isset($data->checkLacunas) ? (int)$data->checkLacunas : 0;
        $this->gravacao->check_simplificado = isset($data->checkSimplificado) ? (int)$data->checkSimplificado : 0;
        $this->gravacao->anotacoes = $data->anotacoes ?? '';
        $this->gravacao->duracao = $data->duracao ?? 0;
        
        if($this->gravacao->create()) {
            http_response_code(201);
            echo json_encode([
                "message" => "Gravação criada com sucesso",
                "id_gravacao" => $this->gravacao->id_gravacao
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao criar gravação."]);
        }
    }
    
    public function atualizar($id) {
        $id_usuario = $this->getUserId();
        $data = json_decode(file_get_contents("php://input"));
        
        $this->gravacao->id_gravacao = $id;
        $this->gravacao->id_usuario = $id_usuario;
        
        if(!$this->gravacao->readOne()) {
            http_response_code(404);
            echo json_encode(["message" => "Gravação não encontrada"]);
            return;
        }
        
        $this->gravacao->nome = $data->nome ?? $this->gravacao->nome;
        $this->gravacao->url = $data->url ?? $this->gravacao->url;
        $this->gravacao->anotacoes = $data->anotacoes ?? $this->gravacao->anotacoes;
        $this->gravacao->check_palavras_simples = isset($data->checkPalavrasSimples) ? (int)$data->checkPalavrasSimples : (int)$this->gravacao->check_palavras_simples;
        $this->gravacao->check_analogias = isset($data->checkAnalogias) ? (int)$data->checkAnalogias : (int)$this->gravacao->check_analogias;
        $this->gravacao->check_lacunas = isset($data->checkLacunas) ? (int)$data->checkLacunas : (int)$this->gravacao->check_lacunas;
        $this->gravacao->check_simplificado = isset($data->checkSimplificado) ? (int)$data->checkSimplificado : (int)$this->gravacao->check_simplificado;
        
        if($this->gravacao->update()) {
            echo json_encode(["message" => "Gravação atualizada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao atualizar gravação."]);
        }
    }
    
    public function deletar($id) {
        $id_usuario = $this->getUserId();
        
        $this->gravacao->id_gravacao = $id;
        $this->gravacao->id_usuario = $id_usuario;
        
        if($this->gravacao->delete()) {
            echo json_encode(["message" => "Gravação deletada com sucesso"]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Erro ao deletar gravação."]);
        }
    }
}
?>
